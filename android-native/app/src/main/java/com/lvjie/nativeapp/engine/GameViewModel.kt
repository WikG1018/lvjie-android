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
                _state.value = restored
                _world.value = WorldPacks.byId(restored.worldId)
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
        _state.value = SampleContent.newGame(worldId, name)
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
                _state.value = existing
                _world.value = WorldPacks.byId(existing.worldId)
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
                _state.value = existing
                _world.value = WorldPacks.byId(existing.worldId)
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
            val s = _state.value
            kotlinx.coroutines.runBlocking {
                saves.writeSave(s)
            }
        } catch (_: Throwable) { }
        bgm.stop()
        super.onCleared()
    }

    fun persist() {
        val s = _state.value
        viewModelScope.launch { saves.writeSave(s) }
    }

    fun moveTo(placeId: String) {
        _state.update { it.copy(loc = placeId) }
        val place = _world.value.places.firstOrNull { it.id == placeId }
        if (place != null) pushFeedback("已抵达 ${place.name}")
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
                    _state.value = restored
                    _world.value = WorldPacks.byId(restored.worldId)
                }
                pushFeedback("已导入 $n 个世界存档")
            } else {
                // 尝试单份 PlayerState
                val single = runCatching {
                    saveJson.decodeFromString(PlayerState.serializer(), raw.trim())
                }.getOrNull()
                if (single != null && single.worldId.isNotBlank() && single.name.isNotBlank()) {
                    saves.writeSave(single)
                    _state.value = single
                    _world.value = WorldPacks.byId(single.worldId)
                    pushFeedback("已导入存档：${single.name}")
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
            // 写入该世界默认档，避免启动时恢复到其它世界
            val fallback = SampleContent.newGame(id)
            saves.writeSave(fallback)
            _state.value = fallback
            _event.value = null
            eventCount = 0
            _hasSave.value = true
            pushFeedback("《${_world.value.name}》已重置为初始存档")
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
        val pack = _world.value
        eventCount += 1
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
                val langInstr = when (s.lang) {
                    "繁體中文" -> "用繁體中文書寫"
                    "English" -> "Write in English"
                    "日本語" -> "日本語で書いてください"
                    else -> "用简体中文书写"
                }
                appendLine(langInstr + "，2~4 段叙事，结尾给出 2~3 个可选行动（每行一个，以 1. 2. 3. 开头）。")
                append("不要输出 JSON。")
            }
            val user = custom?.let { "玩家自由行动：$it" } ?: "行动：${actionId}"

            val buf = StringBuilder()
            var failed = false
            try {
                llm.stream(_llmConfig.value, system, user)
                    .collect { piece ->
                        buf.append(piece)
                        _event.update { it?.copy(shownText = buf.toString(), loading = false) }
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

            // 完成后解析选项
            val text = buf.toString()
            if (text.isNotEmpty()) {
                val lines = text.lines().map { it.trim() }
                val optRe = Regex("""^\s*\d+[\.\uFF0E、\)）]\s*(.+)$""")
                val opts = lines.mapNotNull { line -> optRe.find(line.trim())?.groupValues?.getOrNull(1) }
                val cleaned = lines.filterNot { optRe.matches(it.trim()) }.joinToString("\n")
                _event.update {
                    it?.copy(
                        fullText = cleaned.ifEmpty { text },
                        shownText = cleaned.ifEmpty { text },
                        options = opts.take(3),
                        streaming = false,
                        loading = false,
                        progressGain = 10 + (8..20).random(),
                        moneyGain = if ((0..1).random() == 1) (10..40).random() else 0,
                    )
                }
            } else {
                _event.update { it?.copy(loading = false, streaming = false) }
            }
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
        if (_state.value.dialogLimit && eventCount > 0 && eventCount % 10 == 0) {
            pushFeedback("已达约 10 轮，建议结束事件收束剧情")
        }
    }

    fun endEvent() {
        val ev = _event.value ?: return
        streamJob?.cancel()
        streamJob = null
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

            val pg = if (ev.progressGain == 0 && ev.fromLlm) 8 else ev.progressGain
            val mg = if (ev.moneyGain == 0 && ev.fromLlm) 5 else ev.moneyGain
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
