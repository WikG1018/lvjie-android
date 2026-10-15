package com.lvjie.nativeapp.engine

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.lvjie.nativeapp.data.GlobalPrefs
import com.lvjie.nativeapp.data.BigEvent
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.SampleContent
import com.lvjie.nativeapp.data.SaveRepository
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.data.WorldPacks
import com.lvjie.nativeapp.data.InventoryItem
import com.lvjie.nativeapp.llm.CredentialsRepository
import com.lvjie.nativeapp.llm.LlmConfig
import com.lvjie.nativeapp.llm.LlmService
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EventUi(
    val kind: String = "",
    val count: Int = 1,
    val fullText: String = "",
    val shownText: String = "",
    val options: List<String> = emptyList(),
    val streaming: Boolean = false,
    val loading: Boolean = false,
    val progressGain: Int = 0,
    val moneyGain: Int = 0,
    val itemGain: String? = null,
    val fromLlm: Boolean = false,
)

data class Feedback(val message: String, val big: Boolean = false)

class GameViewModel(app: Application) : AndroidViewModel(app) {
    private val saves = SaveRepository(app)
    private val creds = CredentialsRepository(app)
    private val llm = LlmService()
    val bgm = BgmPlayer(app)
    private val appContext = app.applicationContext

    private val _state = MutableStateFlow(SampleContent.newGame("xiuxian"))
    val state: StateFlow<PlayerState> = _state.asStateFlow()

    private val _world = MutableStateFlow(WorldPacks.byId("xiuxian"))
    val world: StateFlow<WorldPack> = _world.asStateFlow()

    private val _event = MutableStateFlow<EventUi?>(null)
    val event: StateFlow<EventUi?> = _event.asStateFlow()

    private val _feedback = MutableStateFlow<Feedback?>(null)
    val feedback: StateFlow<Feedback?> = _feedback.asStateFlow()

    private val _breakthrough = MutableStateFlow<String?>(null)
    val breakthrough: StateFlow<String?> = _breakthrough.asStateFlow()

    private val _llmConfig = MutableStateFlow(LlmConfig())
    val llmConfig: StateFlow<LlmConfig> = _llmConfig.asStateFlow()

    private val _globalPrefs = MutableStateFlow(GlobalPrefs())
    val globalPrefs: StateFlow<GlobalPrefs> = _globalPrefs.asStateFlow()

    private val _modelList = MutableStateFlow<List<String>>(emptyList())
    val modelList: StateFlow<List<String>> = _modelList.asStateFlow()

    private var streamJob: Job? = null
    private var loadJob: Job? = null
    private var eventCount = 0
    private var eventRounds = 0

    init {
        viewModelScope.launch {
            saves.prefsFlow.collect { _globalPrefs.value = it }
        }
        viewModelScope.launch {
            creds.configFlow.collect { _llmConfig.value = it }
        }
        viewModelScope.launch {
            saves.loadCustomPacksOnce()
        }
        loadJob = viewModelScope.launch {
            saves.loadCustomPacksOnce()
            saves.customPacksFlow.value.forEach { WorldPacks.registerCustom(it) }
            val activeId = saves.activeWorldId.first().ifBlank { "xiuxian" }
            val restored = saves.readSave(activeId)
                ?: WorldPacks.all.firstNotNullOfOrNull { saves.readSave(it.id) }
            if (restored != null) {
                _hasSave.value = true
                installSave(restored)
            }
            syncBgm()
        }
    }

    fun selectWorld(id: String) {
        _world.value = WorldPacks.byId(id)
    }

    fun startGame(worldId: String, name: String = "林逸", forceNew: Boolean = true) {
        if (loadJob?.isActive == true && forceNew) {
            pushFeedback("正在读取存档…")
            return
        }
        val pack = WorldPacks.byId(worldId)
        _world.value = pack
        _state.value = SampleContent.newGame(worldId, name).let { base ->
            val g = _globalPrefs.value
            base.copy(name = name.ifBlank { base.name }, lang = g.lang, aiStyle = g.aiStyle, bgm = g.bgm, dialogLimit = g.dialogLimit)
        }
        _event.value = null
        eventCount = 0
        persist()
        _hasSave.value = true
        syncBgm()
    }

    /** 有存档则续玩，否则开新档 */
    fun startOrContinue(worldId: String, name: String = "林逸") {
        if (loadJob?.isActive == true) {
            pushFeedback("正在读取存档…")
            return
        }
        viewModelScope.launch {
            val existing = saves.readSave(worldId)
            if (existing != null) {
                _hasSave.value = true
                installSave(existing)
                _event.value = null
                eventCount = 0
                pushFeedback("已载入《${_world.value.name}》存档 · ${existing.name}")
            } else {
                val pack = WorldPacks.byId(worldId)
                _world.value = pack
                _state.value = SampleContent.newGame(worldId, name)
                _event.value = null
                eventCount = 0
                persist()
                _hasSave.value = true
                pushFeedback("已开始新旅程")
            }
            syncBgm()
        }
    }

    fun continueLast() {
        if (loadJob?.isActive == true) {
            pushFeedback("正在读取存档…")
            return
        }
        viewModelScope.launch {
            val activeId = saves.activeWorldId.first().ifBlank { "xiuxian" }
            val existing = saves.readSave(activeId)
                ?: WorldPacks.all.firstNotNullOfOrNull { saves.readSave(it.id) }
            if (existing != null) {
                _hasSave.value = true
                installSave(existing)
                _event.value = null
                eventCount = 0
                pushFeedback("继续《${_world.value.name}》· ${existing.name}")
                syncBgm()
            } else {
                pushFeedback("暂无存档，请开始旅程")
            }
        }
    }

    fun syncBgm() {
        bgm.setEnabled(_state.value.bgm)
    }

    override fun onCleared() {
        // 先落盘再 super，避免 scope 取消导致丢档
        try {
            val s = MapHygiene.clean(_state.value)
            kotlinx.coroutines.runBlocking {
                saves.writeSave(s)
            }
        } catch (_: Throwable) { }
        bgm.stop()
        super.onCleared()
    }

    fun persist() {
        val s = MapHygiene.clean(_state.value)
        if (s != _state.value) _state.value = s
        viewModelScope.launch { saves.writeSave(s) }
    }

    fun moveTo(placeId: String) {
        val place = _world.value.places.firstOrNull { it.id == placeId }
        _state.update { current ->
            current.copy(
                loc = placeId,
                friends = Party.follow(current.friends, place?.name.orEmpty()),
            )
        }
        if (place != null) pushFeedback("已抵达 ${place.name}")
        persist()
    }

    fun toggleTravel(name: String) {
        val here = currentPlaceName()
        val (friends, message) = Party.toggle(_state.value.friends, name, here)
        _state.value = _state.value.copy(friends = friends)
        pushFeedback(message)
        persist()
    }

    fun spar(name: String) {
        val day = Party.dayKey(_state.value.ageDays)
        val (friends, message) = Party.spar(_state.value.friends, name, day)
        _state.value = _state.value.copy(friends = friends)
        pushFeedback(message)
        persist()
    }

    fun setGender(gender: String) {
        _state.update { it.copy(gender = MapHygiene.normGender(gender)) }
        persist()
    }

    fun setBgm(on: Boolean) {
        _state.update { it.copy(bgm = on) }
        viewModelScope.launch { saves.setBgm(on) }
        bgm.setEnabled(on)
        persist()
    }

    fun endTravel(name: String, returnHome: Boolean) {
        val here = currentPlaceName()
        val before = _state.value.friends
        val friends = Party.endTravel(before, name, here, returnHome)
        _state.value = _state.value.copy(friends = friends)
        val was = before.firstOrNull { it.name == name }
        if (was != null && was.traveling) {
            val at = friends.firstOrNull { it.name == name }?.at.orEmpty()
            pushFeedback(if (returnHome && was.origin.isNotBlank()) "已送 $name 回$at" else "$name 留在$at")
        }
        persist()
    }

    fun dismissAll(returnHome: Boolean) {
        val here = currentPlaceName()
        _state.value = _state.value.copy(
            friends = Party.dismissAll(_state.value.friends, here, returnHome),
        )
        pushFeedback(if (returnHome) "已解散同行，能送回的已送回" else "已解散同行，同伴留在原地")
        persist()
    }

    fun teamPower(): Int = Party.teamPower(_state.value.power, _state.value.friends)

    fun ageText(): String = StoryApply.ageText(_state.value.ageDays, _state.value.age)

    private fun installSave(restored: PlayerState) {
        val cleaned = MapHygiene.clean(restored)
        _state.value = cleaned
        _world.value = MapHygiene.overlay(WorldPacks.byId(cleaned.worldId), cleaned)
    }

    private fun currentPlaceName(): String {
        val state = _state.value
        return _world.value.places.firstOrNull { it.id == state.loc }?.name.orEmpty()
    }

    /** 扣款（最低档计，高抵低找零） */
    fun spendMoney(cost: Int, reason: String = "付款"): Boolean {
        val w = Money.of(_state.value)
        val n = Money.spend(w, cost) ?: run {
            pushFeedback("货币不足：$reason 需 $cost")
            return false
        }
        _state.value = Money.apply(_state.value, n)
        pushFeedback("$reason -$cost")
        persist()
        return true
    }

    /** 求婚：同场景、好感足够才成功（对齐上游婚姻语义） */
    fun propose(name: String) {
        if (!_world.value.marriage) {
            pushFeedback("本世界未开启婚姻")
            return
        }
        val s = _state.value
        val idx = s.friends.indexOfFirst { it.name == name }
        if (idx < 0) {
            pushFeedback("先结识 $name")
            return
        }
        val f = s.friends[idx]
        if (f.married) {
            pushFeedback("$name 已是伴侣")
            return
        }
        val loc = _world.value.places.firstOrNull { it.id == s.loc }?.name ?: ""
        if (f.at.isNotBlank() && f.at != loc) {
            pushFeedback("需与 $name 同场景才能表白（当前在 $loc）")
            return
        }
        if (f.favor < 60) {
            pushFeedback("好感不足（${f.favor}/60），求婚被婉拒")
            startEvent("talk", "向${name}表白但被婉拒")
            return
        }
        val updated = s.friends.toMutableList()
        updated[idx] = f.copy(married = true, rel = "伴侣", favor = (f.favor + 20).coerceAtMost(100))
        _state.value = s.copy(friends = updated)
        pushFeedback("求婚成功 · $name 成为伴侣")
        startEvent("talk", "与${name}订下终身")
        persist()
    }

    fun useItem(index: Int) {
        var feedback: String? = null
        _state.update { s ->
            val item = s.inventory.getOrNull(index) ?: return@update s
            if (item.type != "consumable") return@update s
            val gain = item.value.takeIf { it > 0 } ?: 20
            val inv = s.inventory.toMutableList()
            val updated = item.copy(count = item.count - 1)
            if (updated.count <= 0) inv.removeAt(index) else inv[index] = updated
            feedback = "使用 ${item.name} · ${_world.value.progress} +$gain"
            s.copy(progress = s.progress + gain, inventory = inv)
        }
        feedback?.let { pushFeedback(it); persist() }
    }

    fun toggleLimit() {
        _state.update { it.copy(dialogLimit = !it.dialogLimit) }
        viewModelScope.launch { saves.setDialogLimit(_state.value.dialogLimit) }
        persist()
    }

    fun toggleBgm() {
        val on = !_state.value.bgm
        _state.update { it.copy(bgm = on) }
        viewModelScope.launch { saves.setBgm(on) }
        bgm.setEnabled(on)
        pushFeedback(if (on) "背景音乐已开启" else "背景音乐已关闭")
        persist()
    }

    fun setAiStyle(style: String) {
        _state.update { it.copy(aiStyle = style) }
        viewModelScope.launch { saves.setAiStyle(style) }
        persist()
    }

    fun saveLlmConfig(baseUrl: String, model: String, apiKey: String, protocol: String) {
        val cfg = LlmConfig(baseUrl, apiKey, model, protocol)
        viewModelScope.launch {
            creds.save(cfg)
            pushFeedback("API 配置已保存")
        }
        _llmConfig.value = cfg
    }

    fun testApi() {
        viewModelScope.launch {
            val r = llm.test(_llmConfig.value)
            pushFeedback(r.getOrElse { "连通失败：" + (it.message ?: "未知错误") })
        }
    }

    fun refreshModels() {
        viewModelScope.launch {
            val r = llm.listModels(_llmConfig.value)
            r.onSuccess {
                _modelList.value = it
                pushFeedback("已拉取 ${it.size} 个模型")
            }.onFailure {
                pushFeedback("拉取失败：" + (it.message ?: ""))
            }
        }
    }

    private val saveJson = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
    private val _hasSave = MutableStateFlow(false)
    val hasSave: StateFlow<Boolean> = _hasSave.asStateFlow()

    private val _exportJson = MutableStateFlow<String?>(null)
    val exportJson: StateFlow<String?> = _exportJson.asStateFlow()

    fun clearExportJson() { _exportJson.value = null }

    /** 导出全部世界存档 JSON（不含 API Key），供分享/复制 */
    fun exportSaves() {
        viewModelScope.launch {
            val json = saves.exportBundle()
            _exportJson.value = json
            pushFeedback("已生成存档 JSON（${json.length} 字符），可分享或复制")
        }
    }

    /** 导入存档 JSON（支持 {saves:{...}} 或单份 PlayerState） */
    fun importSaves(raw: String) {
        viewModelScope.launch {
            if (raw.isBlank()) {
                pushFeedback("导入内容为空")
                return@launch
            }
            val n = saves.importBundle(raw.trim())
            if (n > 0) {
                // 刷新当前内存态
                val restored = saves.readSave(_state.value.worldId)
                    ?: saves.readSave(_world.value.id)
                if (restored != null) {
                    installSave(restored)
                    persist()
                }
                pushFeedback("已导入 $n 个世界存档")
            } else {
                // 尝试单份 PlayerState
                val single = runCatching {
                    saveJson.decodeFromString(PlayerState.serializer(), raw.trim())
                }.getOrNull()
                if (single != null && single.worldId.isNotBlank() && single.name.isNotBlank()) {
                    val cleaned = MapHygiene.clean(single)
                    saves.writeSave(cleaned)
                    installSave(cleaned)
                    pushFeedback("已导入存档：${cleaned.name}")
                } else {
                    pushFeedback("无法解析存档 JSON 或字段非法")
                }
            }
        }
    }

    /** 删除当前世界存档并回到初始欢迎态 */
    fun deleteCurrentSave(onDone: (() -> Unit)? = null) {
        val id = _state.value.worldId
        viewModelScope.launch {
            saves.deleteSave(id)
            _hasSave.value = false
            _event.value = null
            eventCount = 0
            eventRounds = 0
            // 保留世界主题，但标记无存档；内存态换为未保存演示态不落盘
            val demo = SampleContent.newGame(id)
            _state.value = demo
            pushFeedback("《${_world.value.name}》存档已删除")
            onDone?.invoke()
        }
    }

    /** 自定义世界包：保存草稿并可选用 */
    data class WorldDraft(
        val name: String,
        val tagline: String,
        val tiers: List<String>,
        val places: List<String>,
        val rules: String = "",
    )

    private val _draft = MutableStateFlow<WorldDraft?>(null)
    val draft: StateFlow<WorldDraft?> = _draft.asStateFlow()
    private val _draftProgress = MutableStateFlow(0f)
    val draftProgress: StateFlow<Float> = _draftProgress.asStateFlow()

    /** 用 LLM 生成世界包草稿；失败回退本地模板 */
    fun generateWorldDraft(name: String, tagline: String, source: String) {
        viewModelScope.launch {
            _draftProgress.value = 0.08f
            val cfg = _llmConfig.value
            val useLlm = cfg.apiKey.isNotEmpty() && !cfg.baseUrl.contains("example.com")
            val fallback = WorldDraft(
                name = name.ifBlank { "自定义世界" },
                tagline = tagline.ifBlank { "自定义世界观" },
                tiers = listOf("初阶", "入门", "精通", "大成", "化境", "登峰"),
                places = listOf("起点 · " + name.take(4), "聚落", "险地", "秘境"),
                rules = tagline,
            )
            if (!useLlm) {
                delay(600)
                _draftProgress.value = 1f
                _draft.value = fallback
                pushFeedback("已用本地模板生成草稿（未配置 LLM）")
                return@launch
            }
            val prompt = buildString {
                appendLine("你是开放世界文字游戏世界包架构师。根据设定输出 JSON，不要其它文字。")
                appendLine("字段：name, tagline, tiers(6个等级名字符串数组), places(4个地点名字符串数组), rules(一句话铁律)。")
                appendLine("来源：$source")
                appendLine("世界名：$name")
                appendLine("设定：$tagline")
                append("语言与设定一致。")
            }
            try {
                _draftProgress.value = 0.35f
                val raw = llm.complete(cfg, "只输出 JSON", prompt).getOrThrow()
                _draftProgress.value = 0.8f
                val json = kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
                val cleaned = raw.substringAfter('{').substringBeforeLast('}').let { "{$it}" }
                val el = runCatching {
                    json.parseToJsonElement(cleaned) as? kotlinx.serialization.json.JsonObject
                }.getOrNull()
                if (el != null) {
                    fun arr(key: String, def: List<String>): List<String> {
                        val a = el[key] as? JsonArray ?: return def
                        val list = a.mapNotNull { runCatching { it.jsonPrimitive.contentOrNull }.getOrNull() }
                            .filter { !it.isNullOrBlank() }
                        return list.ifEmpty { def }
                    }
                    _draft.value = WorldDraft(
                        name = el["name"]?.let { it.jsonPrimitive.contentOrNull } ?: fallback.name,
                        tagline = el["tagline"]?.let { it.jsonPrimitive.contentOrNull } ?: fallback.tagline,
                        tiers = arr("tiers", fallback.tiers),
                        places = arr("places", fallback.places),
                        rules = el["rules"]?.let { it.jsonPrimitive.contentOrNull } ?: fallback.rules,
                    )
                    _draftProgress.value = 1f
                    pushFeedback("LLM 草稿已生成")
                    return@launch
                }
            } catch (e: CancellationException) {
                throw e
            } catch (_: Throwable) {
                pushFeedback("LLM 生成失败，已用本地模板")
            }
            _draftProgress.value = 1f
            _draft.value = fallback
        }
    }

    fun clearDraft() { _draft.value = null; _draftProgress.value = 0f }

    fun removeCustomPack(id: String) {
        viewModelScope.launch {
            saves.deleteCustomPack(id)
            com.lvjie.nativeapp.data.WorldPacks.unregisterCustom(id)
            pushFeedback("自定义世界已删除")
        }
    }

    fun saveCustomPack(id: String, name: String, tagline: String, tiers: List<String>, placeNames: List<String>) {
        val safeTiers = tiers.filter { it.isNotBlank() }.ifEmpty { listOf("初期", "中期", "后期") }
        val safePlaces = placeNames.filter { it.isNotBlank() }.ifEmpty { listOf("起点") }
        if (name.isBlank()) {
            pushFeedback("世界名不能为空")
            return
        }
        viewModelScope.launch {
            val cp = com.lvjie.nativeapp.data.CustomPack(id, name, tagline, safeTiers, safePlaces)
            saves.saveCustomPack(id, name, tagline, safeTiers, safePlaces)
            WorldPacks.registerCustom(cp)
            pushFeedback("自定义世界「$name」已保存并可开局")
        }
    }

    val customPacks: StateFlow<List<com.lvjie.nativeapp.data.CustomPack>> = saves.customPacksFlow

    fun setLang(lang: String) {
        _state.update { it.copy(lang = lang) }
        viewModelScope.launch { saves.setLang(lang) }
        persist()
    }

        /** 与 NPC 交谈：提升好感，必要时结识为同伴 */
    fun talkWith(name: String) {
        val ev = _event.value
        if (ev?.loading == true || ev?.streaming == true) {
            pushFeedback("事件进行中，请先结束")
            return
        }
        val s = _state.value
        val existing = s.friends.indexOfFirst { it.name == name }
        val updated = if (existing >= 0) {
            val old = s.friends[existing]
            val bumped = old.copy(favor = (old.favor + 3).coerceAtMost(100))
            s.friends.toMutableList().also { it[existing] = bumped }
        } else {
            s.friends + com.lvjie.nativeapp.data.Friend(
                name = name,
                rel = "相识",
                favor = 25,
                at = _world.value.places.firstOrNull { it.id == s.loc }?.name ?: "",
                intro = "在旅途中结识。",
            )
        }
        _state.value = s.copy(friends = updated)
        pushFeedback("与 $name 交好" + if (existing >= 0) " · 好感 +3" else " · 已结为同伴")
        persist()
        startEvent("talk", "与${name}交谈")
    }

    fun startEvent(actionId: String, custom: String? = null) {
        val cur = _event.value
        if (cur?.loading == true || cur?.streaming == true) {
            pushFeedback("事件生成中，请稍候")
            return
        }
        if (cur != null) {
            settleCurrentEventGains(cur)
        }
        val pack = _world.value
        eventCount += 1
        eventRounds += 1
        val kind = custom?.let { "自由行动" }
            ?: pack.actions.firstOrNull { it.id == actionId }?.label
            ?: "事件"

        // 优先走 LLM；失败/未配置则本地模板
        val cfg = _llmConfig.value
        val useLlm = cfg.apiKey.isNotEmpty() && cfg.baseUrl.isNotEmpty()
                && !cfg.baseUrl.contains("example.com")

        if (useLlm) {
            _event.value = EventUi(
                kind = kind, count = eventCount, shownText = "",
                streaming = true, loading = true, fromLlm = true,
            )
            streamFromLlm(actionId, custom)
        } else {
            val beats = SampleContent.beatsFor(actionId)
            val beat = beats.random()
            val text = custom?.let { "你决定$it。命运的丝线被轻轻拨动……" } ?: beat.text
            _event.value = EventUi(
                kind = kind, count = eventCount, fullText = text, shownText = "",
                options = beat.options, streaming = true, loading = true,
                progressGain = beat.progress, moneyGain = beat.money, itemGain = beat.item,
            )
            streamLocal(text)
        }
    }

    private fun streamLocal(full: String) {
        streamJob?.cancel()
        streamJob = viewModelScope.launch {
            maybeForceEnd()
            delay(280)
            var i = 0
            while (i < full.length) {
                i = if (full[i] == '<') {
                    val close = full.indexOf('>', i)
                    if (close >= 0) close + 1 else full.length
                } else i + 1
                _event.update { it?.copy(shownText = full.substring(0, i), loading = false) }
                val ch = full.getOrNull(i)
                delay(if (ch == '，' || ch == '。' || ch == '！' || ch == '？') 40L else 16L)
            }
            _event.update { it?.copy(shownText = full, streaming = false, loading = false) }
        }
    }

    private fun streamFromLlm(actionId: String, custom: String?) {
        streamJob?.cancel()
        streamJob = viewModelScope.launch {
            val s = _state.value
            val w = _world.value
            val loc = w.places.firstOrNull { it.id == s.loc }
            val system = buildString {
                appendLine("你是开放世界文字游戏「旅界」的叙事引擎。世界观：${w.name}（${w.tagline}）。")
                appendLine("玩家 ${s.name}，等级 ${w.tiers.getOrElse(s.tierIndex) { "?" }}，进度 ${s.progress}/${WorldPacks.tierReq.getOrElse(s.tierIndex + 1) { 9999 }}。")
                appendLine("地点：${loc?.name ?: ""} — ${loc?.desc ?: ""}")
                appendLine("行动风格：${s.aiStyle}。")
                val party = s.friends.filter { it.traveling }
                if (party.isNotEmpty()) {
                    appendLine("同行者：${party.joinToString("、") { it.name }}。他们必须与玩家同场景，战斗时把他们算进去，不得凭空消失。")
                }
                appendLine("不要写出没有名字的生物或物件，禁止使用「未知生物」「未知」充数。")
                appendLine("玩家进入可单独前往的新处所时，写成新地点并让玩家到达那里，不要把它写成当前地点里的一个物件。")
                val langInstr = when (s.lang) {
                    "繁體中文" -> "用繁體中文書寫"
                    "English" -> "Write in English"
                    "日本語" -> "日本語で書いてください"
                    else -> "用简体中文书写"
                }
                appendLine(langInstr + "。只输出一个 ```json 代码块，不要输出其它文字。")
                appendLine("JSON 含 narrative（给玩家看的正文）、options（2~3 个字符串）、changes。")
                appendLine("changes 可含 age_days、money_main、money_mid、money_high、money_peak、progress、add_items、new_locations、modify_locations、move_to。")
                append("不要写 tier 或 tierIndex。新处所写入 new_locations 并用 move_to 到达。")
            }
            val user = custom?.let { "玩家自由行动：$it" } ?: "行动：${actionId}"

            val buf = StringBuilder()
            var failed = false
            try {
                llm.stream(_llmConfig.value, system, user)
                    .collect { piece ->
                        buf.append(piece)
                        val visible = StoryApply.playerText(buf.toString())
                        _event.update { it?.copy(shownText = visible, loading = false) }
                    }
            } catch (e: CancellationException) {
                // 协程取消（如 endEvent）不是 LLM 失败，必须上抛
                throw e
            } catch (e: Throwable) {
                // 失败回退本地；本协程不再继续解析
                failed = true
                val beats = SampleContent.beatsFor(actionId)
                val beat = beats.random()
                _event.value = EventUi(
                    kind = "事件", count = eventCount, fullText = beat.text, shownText = "",
                    options = beat.options, streaming = true, loading = true,
                    progressGain = beat.progress, moneyGain = beat.money, itemGain = beat.item,
                )
                streamLocal(beat.text)
                pushFeedback("LLM 不可用，已切换本地剧情")
            }
            if (failed) return@launch
            val text = buf.toString()
            if (text.isNotEmpty()) {
                val applied = StoryApply.apply(_state.value, _world.value.places, text)
                _state.value = applied.state
                if (applied.state.mapPlaces.isNotEmpty()) {
                    _world.value = _world.value.copy(places = applied.state.mapPlaces)
                }
                _event.update {
                    it?.copy(
                        fullText = applied.display,
                        shownText = applied.display,
                        options = applied.options.take(3),
                        streaming = false,
                        loading = false,
                        progressGain = 0,
                        moneyGain = 0,
                        itemGain = null,
                    )
                }
                persist()
            } else {
                _event.update { it?.copy(loading = false, streaming = false) }
            }
            enforceDialogLimit()
        }
    }

    fun chooseOption(index: Int) {
        val ev = _event.value ?: return
        if (ev.streaming) return
        val label = ev.options.getOrNull(index) ?: return
        // 先结算本轮收益，再进入下一轮
        settleCurrentEventGains(ev)
        startEvent("travel", "以果决的方式回应：$label")
    }

    private fun settleCurrentEventGains(ev: EventUi) {
        if (ev.progressGain == 0 && ev.moneyGain == 0 && ev.itemGain == null) return
        _state.update { s ->
            var inv = s.inventory
            val item = ev.itemGain
            if (item != null) {
                val idx = inv.indexOfFirst { it.name == item }
                inv = if (idx >= 0) {
                    val old = inv[idx]
                    inv.toMutableList().also { it[idx] = old.copy(count = old.count + 1) }
                } else inv + InventoryItem(item, "consumable", 1, "事件所得")
            }
            s.copy(
                progress = s.progress + ev.progressGain,
                money = s.money + ev.moneyGain,
                inventory = inv,
            )
        }
        persist()
    }

    private fun maybeForceEnd() {
        if (!_state.value.dialogLimit) return
        if (eventRounds in 1..Int.MAX_VALUE && eventRounds % 10 == 0 && eventRounds > 0) {
            pushFeedback("已达约 10 轮，自动收束事件")
            // 下一轮开始前收束
        }
    }

    /** 单事件超过 10 轮强制收束 */
    private fun enforceDialogLimit() {
        if (_state.value.dialogLimit && eventRounds >= 10) {
            pushFeedback("已到 10 轮上限，自动结束事件")
            endEvent()
        }
    }

    fun endEvent() {
        val ev = _event.value ?: return
        streamJob?.cancel()
        streamJob = null
        eventRounds = 0
        var itemAdded = false
        _state.update { s ->
            var inv = s.inventory
            val item = ev.itemGain
            if (item != null) {
                itemAdded = true
                val idx = inv.indexOfFirst { it.name == item }
                inv = if (idx >= 0) {
                    val old = inv[idx]
                    inv.toMutableList().also { it[idx] = old.copy(count = old.count + 1) }
                } else inv + InventoryItem(item, "consumable", 1, "野外所得")
            }
            // 任务推进：随机将一个 active 任务标记完成（20%）
            val quests = if (ev.progressGain > 0 && s.quests.any { it.status == "active" } && (0..4).random() == 0) {
                var done = false
                s.quests.map { q ->
                    if (!done && q.status == "active") {
                        done = true
                        q.copy(status = "done")
                    } else q
                }
            } else s.quests

            val pg = ev.progressGain
            val mg = ev.moneyGain
            s.copy(
                progress = s.progress + pg,
                money = s.money + mg,
                inventory = inv,
                quests = quests,
                events = if (ev.progressGain >= 20) {
                    listOf(BigEvent("${s.age} 岁", ev.kind + " · " + ev.progressGain + "点")) + s.events
                } else s.events,
            )
        }
        _event.value = null
        val w = _world.value
        val notes = buildList {
            if (ev.progressGain != 0) add("${w.progress} +${ev.progressGain}")
            if (ev.moneyGain != 0) add("${w.money} +${ev.moneyGain}")
            if (itemAdded) add("获得 ${ev.itemGain}")
        }
        if (notes.isNotEmpty()) pushFeedback(notes.joinToString(" · "))
        persist()
    }

    fun canBreakthrough(): Boolean {
        val s = _state.value
        val maxTier = _world.value.tiers.lastIndex
        return s.tierIndex < maxTier && s.progress >= reqOf(s.tierIndex)
    }

    private fun reqOf(tierIndex: Int): Int {
        val req = WorldPacks.tierReq
        // 用全局阶梯近似；不足则用末档
        return req.getOrElse(tierIndex + 1) { req.last() }
    }

    fun breakthrough() {
        if (!canBreakthrough()) {
            pushFeedback("修为不足，继续积累")
            return
        }
        val pack = _world.value
        _state.update { s ->
            val next = (s.tierIndex + 1).coerceAtMost(pack.tiers.lastIndex)
            s.copy(
                tierIndex = next,
                sub = 0,
                progress = 0,
                power = s.power + 400 + s.tierIndex * 200,
                lifespan = s.lifespan + 40,
                events = listOf(
                    com.lvjie.nativeapp.data.BigEvent("${s.age} 岁", "${pack.advance}成功 · ${pack.tiers[next]}")
                ) + s.events,
            )
        }
        _breakthrough.value = pack.advance + "成功 · " + pack.tiers[_state.value.tierIndex.coerceAtMost(pack.tiers.lastIndex)]
        persist()
    }

    fun dismissBreakthrough() { _breakthrough.value = null }
    fun debugHint(msg: String) = pushFeedback(msg)

    fun clearFeedback() { _feedback.value = null }

    private fun pushFeedback(msg: String, big: Boolean = false) {
        _feedback.value = Feedback(msg, big)
    }
}
