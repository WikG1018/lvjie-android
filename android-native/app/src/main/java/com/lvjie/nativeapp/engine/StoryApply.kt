package com.lvjie.nativeapp.engine

import com.lvjie.nativeapp.data.Beast
import com.lvjie.nativeapp.data.InventoryItem
import com.lvjie.nativeapp.data.Place
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.Spot
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlin.math.round

/**
 * 上游 changes.js / map.js / llm.js extractGameJSON 的纯函数落库。
 * 不依赖 Android。tier / tierIndex 一律忽略，不能写进等级。
 */
object StoryApply {
    data class Applied(
        val state: PlayerState,
        val display: String,
        val options: List<String>,
    )

    private const val AGE_CAP = 3650L
    private const val MONEY_CAP = 10_000_000L
    private const val PROGRESS_CAP = 5_000_000L
    private const val ITEM_LIMIT = 10
    private const val LOC_LIMIT = 6
    private const val MODIFY_LIMIT = 10
    private const val MAP_LIMIT = 80

    private val json = Json { ignoreUnknownKeys = true }
    private val fenceRe = Regex("```json\\s*([\\s\\S]*?)```", RegexOption.IGNORE_CASE)
    private val optionPrefix = Regex("""^\s*\d+[\.\uFF0E、\)）]\s*""")
    private val arrivalRe = Regex("来到|抵达|走进|踏入|已在")

    private val giftAccept = Regex("收下|收了|接过|接受|拿到|获得|得到|收好|收进|揣|领受|笑纳|入怀|收入囊")
    private val giftRefuseHard = Regex("没接|没有接|未接|不接|没敢接|不肯收|拒收|没收下|没有收下|没有收|没有要|没要|拒绝|婉拒|谢绝|回绝|退回|退还|放回|没拿|没有拿|没伸手|未收|作罢|不为所动")
    private val giftRefuseSoft = Regex("推辞|推却|推让|客套|你摇头|你摆手|连连摆手")
    private val giftOffer = Regex("(?:若|如若|如果|只要|倘若|假使|要是)[^「“]{0,14}(?:送|给|塞|递|交|赠)|想(?:给|送|塞|交)|打算(?:给|送|塞|交)|待你|等你(?:回来|赢|胜|到|练成|突破)|要不要|要吗|可好|可要|收不收|任你(?:取|拿|选)|你说了算|推到你面前|递到你面前|放到你面前|放在你面前|摆在你面前|捧到你面前|(?:亮|取)出[^，。]{0,8}(?:给你看|示意|晃了晃)|吗[？?]|[？?]")
    private val giftOfferPrev = Regex("(?:若|如若|如果|只要|倘若|假使|要是)[^「“]{0,14}(?:便|就|则|送|给|塞|递|交|赠)|想(?:给|送|塞|交)|打算(?:给|送|塞|交)|待你|等你(?:回来|赢|胜|到|练成|突破)")
    private val giftOfferNext = Regex("要不要|要吗|可好|收不收|任你(?:取|拿|选)|你说了算|好不好|你看如何|吗[？?]|[？?]")
    private val clauseRe = Regex("[^，。！？；\\n…]+[，。！？；\\n…]*")
    private val giftRes = listOf(
        Regex("[「“]([^」”\\n]{2,20})[」”]\\s*(?:塞|递|交|给|塞进|扔|送)"),
        Regex("(?:塞|递|交|送|给)你(?:一|半|块|张|把|瓶)?[一-鿿]{0,3}?[「“]([^」”\\n]{2,20})[」”]"),
        Regex("(?:塞|递|交|送|给)你(?:一|半)?[个只块张把瓶副条盒粒枚]([一-鿿]{2,12})"),
        Regex("(?:把|将)(?:这|那)?(?:瓶|枚|颗|粒|盒|袋)?([一-鿿]{2,12})(?:赠|送|递|塞)?(?:给|予)?你"),
        Regex("(?:赠|送|赏|赐)(?:给)?你(?:一|两|半)?[个只块张把瓶副条盒粒枚]?([一-鿿]{2,12})"),
        Regex("你(?:收下|接过|接过并收下|得到|获得|拿到)(?:了)?(?:这|那)?(?:瓶|枚|颗|粒|盒|袋)?([一-鿿]{2,12})"),
    )

    fun ageText(ageDays: Int, ageYears: Int): String {
        val days = (if (ageDays == 0) ageYears.toLong() * 360L else ageDays.toLong()).coerceAtLeast(0)
        val y = days / 360
        val m = (days % 360) / 30
        val d = days % 30
        return "${y}岁${m}月${d}天"
    }

    fun playerText(modelText: String): String {
        val root = extractRoot(modelText)
        val narrative = root.str("narrative").trim()
        if (narrative.isNotEmpty()) return stripFences(narrative)
        val partial = partialNarrative(modelText)
        if (!partial.isNullOrBlank()) return stripFences(partial)
        val stripped = stripFences(modelText).trim()
        if (stripped.startsWith("{") || stripped.contains("\"narrative\"") || stripped.contains("\"changes\"")) {
            return ""
        }
        return stripped
    }

    /** 上游 giftAcceptedAt：宁可漏记，不把没到手的东西写成奖励。 */
    fun giftAcceptedAt(narrative: String, index: Int): Boolean {
        val clauses = splitClauses(narrative)
        if (clauses.isEmpty()) return true
        var ci = clauses.indexOfFirst { index >= it.start && index < it.start + it.text.length }
        if (ci < 0) ci = 0
        val cur = clauses[ci].text
        val prev = clauses.getOrNull(ci - 1)?.text.orEmpty()
        val next = clauses.getOrNull(ci + 1)?.text.orEmpty()
        if (giftRefuseHard.containsMatchIn(cur) || giftRefuseHard.containsMatchIn(next)) return false
        if (giftAccept.containsMatchIn(cur)) return true
        if (giftOffer.containsMatchIn(cur)) return false
        if (giftOfferPrev.containsMatchIn(prev) && !giftAccept.containsMatchIn(cur)) return false
        if (giftOfferNext.containsMatchIn(next)) return false
        if (giftRefuseSoft.containsMatchIn(cur) && !giftAccept.containsMatchIn(next)) return false
        return true
    }

    fun extractGiftNames(narrative: String): List<String> {
        val names = mutableListOf<String>()
        for (re in giftRes) {
            for (m in re.findAll(narrative)) {
                if (!giftAcceptedAt(narrative, m.range.first)) continue
                val raw = m.groupValues.getOrNull(1).orEmpty()
                val name = raw.trim().replace(Regex("[，。！？…~]+$"), "")
                if (name.length < 2 || name.length > 20) continue
                if (!names.contains(name)) names.add(name)
                if (names.size >= 8) return names
            }
        }
        return names
    }

    fun apply(
        state: PlayerState,
        places: List<Place>,
        modelText: String,
        nowMillis: Long = System.currentTimeMillis(),
    ): Applied {
        val root = extractRoot(modelText)
        val display = playerText(modelText)
        val changes = root?.get("changes") as? JsonObject
        var next = state
        next = applyAge(next, changes)
        next = applyMoney(next, changes)
        next = applyProgress(next, changes)
        next = next.copy(inventory = applyItems(next.inventory, changes, display))
        val mapped = applyLocations(next, places, changes, nowMillis)
        next = mapped.first
        next = applyMove(next, mapped.second, changes, display)
        return Applied(next, display, optionsOf(root))
    }

    private fun applyAge(state: PlayerState, changes: JsonObject?): PlayerState {
        val raw = changes.long("age_days") ?: return state
        val delta = capAbs(raw, AGE_CAP)
        if (delta == 0L) return state
        val base = if (state.ageDays == 0 && state.age > 0) state.age.toLong() * 360L else state.ageDays.toLong()
        val days = (base + delta).coerceAtLeast(0).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
        return state.copy(
            ageDays = days,
            age = days / 360,
            friends = state.friends.map { friend ->
                if (!friend.traveling) friend
                else friend.copy(ageDays = (friend.ageDays.toLong() + delta).coerceAtLeast(0).toInt())
            },
        )
    }

    private fun applyMoney(state: PlayerState, changes: JsonObject?): PlayerState {
        var next = state
        changes.long("money_main")?.let { next = next.copy(money = addNonNegative(next.money, it)) }
        changes.long("money_mid")?.let { next = next.copy(moneyMid = addNonNegative(next.moneyMid, it)) }
        changes.long("money_high")?.let { next = next.copy(moneyHigh = addNonNegative(next.moneyHigh, it)) }
        changes.long("money_peak")?.let { next = next.copy(moneyPeak = addNonNegative(next.moneyPeak, it)) }
        return next
    }

    private fun applyProgress(state: PlayerState, changes: JsonObject?): PlayerState {
        val raw = changes.long("progress") ?: return state
        val delta = capAbs(raw, PROGRESS_CAP)
        if (delta == 0L) return state
        val next = (state.progress.toLong() + delta).coerceIn(0, Int.MAX_VALUE.toLong()).toInt()
        return state.copy(progress = next)
    }

    private fun applyItems(inventory: List<InventoryItem>, changes: JsonObject?, narrative: String): List<InventoryItem> {
        val fromJson = (changes?.get("add_items") as? JsonArray).orEmpty().mapNotNull { element ->
            val obj = element as? JsonObject ?: return@mapNotNull null
            val name = obj.str("name").trim().take(24)
            if (name.isEmpty()) null
            else ItemSpec(name, obj.str("desc").take(80), itemCount(obj), obj.str("type").ifBlank { "consumable" }.take(24))
        }
        val have = fromJson.map { it.name }
        val gifts = extractGiftNames(narrative)
            .filter { gift -> have.none { name -> name.contains(gift) || gift.contains(name) } }
            .map { ItemSpec(it.take(24), "剧情赠与", 1, "special") }
        val specs = (fromJson + gifts).take(ITEM_LIMIT)
        var inv = inventory
        for (spec in specs) inv = stack(inv, spec)
        return inv
    }

    private fun stack(inventory: List<InventoryItem>, spec: ItemSpec): List<InventoryItem> {
        val idx = inventory.indexOfFirst { it.name == spec.name }
        if (idx >= 0) {
            val old = inventory[idx]
            val count = (old.count.toLong() + spec.count).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
            return inventory.toMutableList().also { it[idx] = old.copy(count = count) }
        }
        return inventory + InventoryItem(name = spec.name, type = spec.type, count = spec.count, desc = spec.desc)
    }

    private fun applyLocations(
        state: PlayerState,
        places: List<Place>,
        changes: JsonObject?,
        nowMillis: Long,
    ): Pair<PlayerState, List<Place>> {
        val base = if (state.mapPlaces.isNotEmpty()) state.mapPlaces else places
        val working = base.toMutableList()
        var dirty = false
        dirty = applyNewLocations(working, changes, nowMillis) || dirty
        dirty = applyModifyLocations(working, changes) || dirty
        if (!dirty && state.mapPlaces.isEmpty()) return state to places
        val cleaned = MapHygiene.cleanPlaces(working)
        return state.copy(mapPlaces = cleaned) to cleaned
    }

    private fun applyNewLocations(map: MutableList<Place>, changes: JsonObject?, nowMillis: Long): Boolean {
        val arr = (changes?.get("new_locations") as? JsonArray)?.take(LOC_LIMIT).orEmpty()
        if (arr.isEmpty()) return false
        var dirty = false
        var seq = 0
        for (element in arr) {
            val raw = element as? JsonObject ?: continue
            val name = raw.str("name").trim()
            if (name.isEmpty()) continue
            val exist = map.indexOfFirst { it.name == name }
            if (exist >= 0) {
                val merged = mergeInto(map[exist], raw)
                if (merged != map[exist]) {
                    map[exist] = merged
                    dirty = true
                }
                continue
            }
            if (map.size >= MAP_LIMIT) break
            val current = map.firstOrNull()
            val created = Place(
                id = allocId(map, nowMillis, seq),
                name = name,
                type = raw.str("type").ifBlank { "地点" }.take(24),
                world = raw.str("world").ifBlank { current?.world.orEmpty() },
                desc = raw.str("desc").take(2000),
                people = mergePeople(emptyList(), peopleOf(raw["people"])),
                shop = raw.bool("shop") == true,
                beasts = beastsOf(raw["beasts"]),
                interactables = spotsOf(raw["interactables"]),
                continent = raw.str("continent").ifBlank { current?.continent.orEmpty() },
            )
            map.add(created)
            seq++
            dirty = true
        }
        return dirty
    }

    private fun applyModifyLocations(map: MutableList<Place>, changes: JsonObject?): Boolean {
        val arr = (changes?.get("modify_locations") as? JsonArray)?.take(MODIFY_LIMIT).orEmpty()
        if (arr.isEmpty()) return false
        var dirty = false
        for (element in arr) {
            val raw = element as? JsonObject ?: continue
            val name = raw.str("name").trim()
            if (name.isEmpty()) continue
            val idx = map.indexOfFirst { it.name == name }
            if (idx < 0) continue
            var loc = map[idx]
            if (raw.containsKey("desc")) loc = loc.copy(desc = raw.str("desc").take(2000))
            val notes = stringList(raw["notes"]).map { it.take(200) }
            val change = raw.str("change").take(200)
            val extraNotes = notes + listOfNotNull(change.takeIf { it.isNotEmpty() })
            if (extraNotes.isNotEmpty()) loc = loc.copy(notes = (loc.notes + extraNotes).takeLast(30))
            if (change.isNotEmpty()) {
                val desc = (if (loc.desc.isBlank()) change else loc.desc + " " + change).take(2000)
                loc = loc.copy(desc = desc)
            }
            if (raw["beasts"] is JsonArray) loc = loc.copy(beasts = mergeBeasts(loc.beasts, beastsOf(raw["beasts"])))
            if (raw["interactables"] is JsonArray) {
                loc = loc.copy(interactables = mergeSpots(loc.interactables, spotsOf(raw["interactables"])))
            }
            if (loc != map[idx]) {
                map[idx] = loc
                dirty = true
            }
        }
        return dirty
    }

    private fun mergeInto(place: Place, raw: JsonObject): Place {
        var next = place
        if (raw["beasts"] is JsonArray) next = next.copy(beasts = mergeBeasts(next.beasts, beastsOf(raw["beasts"])))
        if (raw["interactables"] is JsonArray) {
            next = next.copy(interactables = mergeSpots(next.interactables, spotsOf(raw["interactables"])))
        }
        if (raw["people"] is JsonArray) next = next.copy(people = mergePeople(next.people, peopleOf(raw["people"])))
        return next
    }

    private fun applyMove(state: PlayerState, places: List<Place>, changes: JsonObject?, narrative: String): PlayerState {
        val named = changes.str("move_to").trim()
        val target = if (named.isNotEmpty()) {
            places.firstOrNull { it.name == named }
        } else {
            inferMove(narrative, places, state.loc)
        } ?: return state
        if (target.id == state.loc) return state
        return state.copy(loc = target.id, friends = Party.follow(state.friends, target.name))
    }

    private fun inferMove(narrative: String, places: List<Place>, currentId: String): Place? {
        if (narrative.isEmpty()) return null
        val start = (narrative.length * 0.4).toInt().coerceIn(0, narrative.length)
        val tail = narrative.substring(start)
        if (!arrivalRe.containsMatchIn(tail)) return null
        return places
            .filter { it.id != currentId && it.name.isNotBlank() && tail.contains(it.name) }
            .maxByOrNull { it.name.length }
    }

    private fun allocId(existing: List<Place>, now: Long, seq: Int): String {
        val base = "n${now + seq}"
        if (existing.none { it.id == base }) return base
        var i = 1
        var candidate = "${base}_$i"
        while (existing.any { it.id == candidate }) {
            i++
            candidate = "${base}_$i"
        }
        return candidate
    }

    private fun optionsOf(root: JsonObject?): List<String> {
        val arr = (root?.get("options") ?: root?.get("choices")) as? JsonArray ?: return emptyList()
        return arr.mapNotNull { element ->
            val text = when (element) {
                is JsonPrimitive -> element.contentOrNull
                is JsonObject -> element.str("label").ifBlank { element.str("text") }
                else -> null
            }?.trim()?.replace(optionPrefix, "")
            text?.takeIf { it.isNotEmpty() }
        }
    }

    private fun extractRoot(text: String): JsonObject? {
        if (text.isBlank()) return null
        fenceRe.find(text)?.groupValues?.getOrNull(1)?.let { body ->
            parseObject(body)?.let { return it }
        }
        val open = text.lastIndexOf("```json")
        if (open >= 0) {
            val body = text.substring(open).replace(Regex("^```json", RegexOption.IGNORE_CASE), "")
            parseObject(body)?.let { return it }
        }
        scanFirstObject(text)?.let { parseObject(it) }?.let { return it }
        return null
    }

    private fun parseObject(raw: String): JsonObject? {
        val trimmed = raw.trim().removePrefix("```json").removePrefix("```").trim()
        if (trimmed.isEmpty()) return null
        val candidates = listOf(trimmed, stripTrailingCommas(trimmed), autoClose(stripTrailingCommas(trimmed)))
        for (candidate in candidates.distinct()) {
            val element = runCatching { json.parseToJsonElement(candidate) }.getOrNull()
            if (element is JsonObject) return element
        }
        return null
    }

    private fun scanFirstObject(text: String): String? {
        val start = text.indexOf('{')
        if (start < 0) return null
        var depth = 0
        var inStr = false
        var esc = false
        for (i in start until text.length) {
            val c = text[i]
            if (inStr) {
                if (esc) esc = false
                else if (c == '\\') esc = true
                else if (c == '"') inStr = false
                continue
            }
            if (c == '"') {
                inStr = true
                continue
            }
            if (c == '{') depth++
            else if (c == '}') {
                depth--
                if (depth == 0) return text.substring(start, i + 1)
            }
        }
        return text.substring(start)
    }

    private fun stripTrailingCommas(source: String): String {
        val out = StringBuilder()
        var inStr = false
        var esc = false
        var i = 0
        while (i < source.length) {
            val c = source[i]
            if (inStr) {
                out.append(c)
                if (esc) esc = false
                else if (c == '\\') esc = true
                else if (c == '"') inStr = false
                i++
                continue
            }
            if (c == '"') {
                inStr = true
                out.append(c)
                i++
                continue
            }
            if (c == ',') {
                var j = i + 1
                while (j < source.length && source[j].isWhitespace()) j++
                if (j < source.length && (source[j] == '}' || source[j] == ']')) {
                    i++
                    continue
                }
            }
            out.append(c)
            i++
        }
        return out.toString()
    }

    private fun autoClose(source: String): String {
        var inStr = false
        var esc = false
        val stack = ArrayDeque<Char>()
        for (c in source) {
            if (inStr) {
                if (esc) esc = false
                else if (c == '\\') esc = true
                else if (c == '"') inStr = false
                continue
            }
            when (c) {
                '"' -> inStr = true
                '{' -> stack.addLast('}')
                '[' -> stack.addLast(']')
                '}', ']' -> if (stack.lastOrNull() == c) stack.removeLast()
            }
        }
        val out = StringBuilder(source.trimEnd().trimEnd(','))
        if (inStr) out.append('"')
        while (stack.isNotEmpty()) out.append(stack.removeLast())
        return out.toString()
    }

    private fun partialNarrative(text: String): String? {
        val match = Regex(""""narrative"\s*:\s*"((?:\\.|[^"\\])*)""").find(text) ?: return null
        return unescape(match.groupValues[1]).trim().ifEmpty { null }
    }

    private fun unescape(body: String): String {
        val parsed = runCatching { json.parseToJsonElement("\"$body\"").toString() }.getOrNull()
        if (parsed != null && parsed.length >= 2 && parsed.startsWith("\"")) {
            return runCatching {
                (json.parseToJsonElement("\"$body\"") as JsonPrimitive).content
            }.getOrElse { body }
        }
        return body
            .replace("\\n", "\n")
            .replace("\\r", "\r")
            .replace("\\t", "\t")
            .replace("\\\"", "\"")
            .replace("\\\\", "\\")
    }

    private fun stripFences(text: String): String =
        text.replace(Regex("```json", RegexOption.IGNORE_CASE), "").replace("```", "")

    private fun splitClauses(text: String): List<Clause> {
        return clauseRe.findAll(text).map { Clause(it.value, it.range.first) }.toList()
    }

    private fun itemCount(obj: JsonObject): Int {
        val n = obj.long("count") ?: 1L
        return n.toInt().coerceIn(1, 99)
    }

    private fun addNonNegative(current: Int, delta: Long): Int {
        val capped = capAbs(delta, MONEY_CAP)
        if (capped == 0L) return current
        return (current.toLong() + capped).coerceIn(0, Int.MAX_VALUE.toLong()).toInt()
    }

    private fun capAbs(value: Long, limit: Long): Long = when {
        value > limit -> limit
        value < -limit -> -limit
        else -> value
    }

    private fun peopleOf(element: JsonElement?): List<String> {
        val arr = element as? JsonArray ?: return emptyList()
        return arr.mapNotNull { item ->
            when (item) {
                is JsonPrimitive -> item.contentOrNull
                is JsonObject -> item.str("name").ifBlank { null }
                else -> null
            }
        }
    }

    private fun beastsOf(element: JsonElement?): List<Beast> {
        val arr = element as? JsonArray ?: return emptyList()
        return arr.take(8).mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            normBeast(
                Beast(
                    name = obj.str("name"),
                    realm = obj.str("realm"),
                    power = obj.long("power")?.toInt() ?: 0,
                    drops = obj.str("drops"),
                ),
            )
        }
    }

    private fun spotsOf(element: JsonElement?): List<Spot> {
        val arr = element as? JsonArray ?: return emptyList()
        return arr.take(8).mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            normSpot(obj.str("name"), obj.str("intro"))
        }
    }

    private fun normBeast(beast: Beast): Beast? {
        val name = beast.name.trim().take(24)
        if (name.isEmpty() || name == "未知生物") return null
        return beast.copy(name = name, realm = beast.realm.take(24), power = beast.power.coerceAtLeast(0), drops = beast.drops.take(80))
    }

    private fun normSpot(nameRaw: String, intro: String): Spot? {
        val name = nameRaw.trim().take(24)
        if (name.isEmpty() || name == "未知") return null
        return Spot(name, intro.take(80))
    }

    private fun mergeBeasts(existing: List<Beast>, incoming: List<Beast>): List<Beast> {
        val out = existing.toMutableList()
        for (beast in incoming) {
            val i = out.indexOfFirst { it.name == beast.name }
            if (i >= 0) out[i] = beast else out.add(beast)
        }
        return out
    }

    private fun mergeSpots(existing: List<Spot>, incoming: List<Spot>): List<Spot> {
        val out = existing.toMutableList()
        for (spot in incoming) {
            val i = out.indexOfFirst { it.name == spot.name }
            if (i >= 0) out[i] = spot else out.add(spot)
        }
        return out
    }

    private fun mergePeople(existing: List<String>, incoming: List<String>): List<String> {
        val out = existing.toMutableList()
        for (raw in incoming) {
            val name = raw.trim().take(24)
            if (name.isEmpty()) continue
            if (out.none { it == name }) out.add(name)
        }
        return out
    }

    private fun stringList(element: JsonElement?): List<String> {
        val arr = element as? JsonArray ?: return emptyList()
        return arr.mapNotNull { (it as? JsonPrimitive)?.contentOrNull?.trim() }.filter { it.isNotEmpty() }
    }

    private fun JsonObject?.str(key: String): String {
        val primitive = this?.get(key) as? JsonPrimitive ?: return ""
        return primitive.contentOrNull.orEmpty()
    }

    private fun JsonObject?.long(key: String): Long? {
        val primitive = this?.get(key) as? JsonPrimitive ?: return null
        if (primitive.contentOrNull == null) return null
        val number = primitive.content.toDoubleOrNull() ?: return null
        if (number.isNaN() || number.isInfinite()) return null
        return round(number).toLong()
    }

    private fun JsonObject?.bool(key: String): Boolean? {
        val primitive = this?.get(key) as? JsonPrimitive ?: return null
        return when (primitive.contentOrNull) {
            "true" -> true
            "false" -> false
            else -> null
        }
    }

    private data class Clause(val text: String, val start: Int)
    private data class ItemSpec(val name: String, val desc: String, val count: Int, val type: String)
}
