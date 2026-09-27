package com.lvjie.nativeapp.engine

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.SampleContent
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.data.WorldPacks
import com.lvjie.nativeapp.data.InventoryItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** 事件进行态 */
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
)

/** 一次性反馈 */
data class Feedback(val message: String, val big: Boolean = false)

class GameViewModel : ViewModel() {
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

    private var streamJob: Job? = null
    private var eventCount = 0

    fun selectWorld(id: String) {
        _world.value = WorldPacks.byId(id)
    }

    fun startGame(worldId: String, name: String = "林逸") {
        val pack = WorldPacks.byId(worldId)
        _world.value = pack
        _state.value = SampleContent.newGame(worldId, name)
        _event.value = null
        eventCount = 0
    }

    fun moveTo(placeId: String) {
        _state.update { it.copy(loc = placeId) }
        val place = _world.value.places.firstOrNull { it.id == placeId }
        if (place != null) pushFeedback("已抵达 ${place.name}")
    }

    fun useItem(index: Int) {
        val item = _state.value.inventory.getOrNull(index) ?: return
        if (item.type != "consumable") return
        val gain = item.value.takeIf { it > 0 } ?: 20
        val inv = _state.value.inventory.toMutableList()
        val updated = item.copy(count = item.count - 1)
        if (updated.count <= 0) inv.removeAt(index) else inv[index] = updated
        _state.update {
            it.copy(progress = it.progress + gain, inventory = inv)
        }
        pushFeedback("使用 ${item.name} · ${_world.value.progress} +$gain")
    }

    fun toggleLimit() = _state.update { it.copy(dialogLimit = !it.dialogLimit) }
    fun toggleBgm() = _state.update { it.copy(bgm = !it.bgm) }
    fun setAiStyle(style: String) = _state.update { it.copy(aiStyle = style) }

    fun startEvent(actionId: String, custom: String? = null) {
        val cur = _event.value
        if (cur?.loading == true || cur?.streaming == true) return
        val pack = _world.value
        val beats = SampleContent.beatsFor(actionId)
        val beat = beats.random()
        val kind = custom?.let { "自由行动" }
            ?: pack.actions.firstOrNull { it.id == actionId }?.label
            ?: "事件"
        eventCount += 1
        val text = custom?.let { "你决定$it。命运的丝线被轻轻拨动……" } ?: beat.text

        _event.value = EventUi(
            kind = kind,
            count = eventCount,
            fullText = text,
            shownText = "",
            options = beat.options,
            streaming = true,
            loading = true,
            progressGain = beat.progress,
            moneyGain = beat.money,
            itemGain = beat.item,
        )
        stream(text)
    }

    fun chooseOption(index: Int) {
        val ev = _event.value ?: return
        if (ev.streaming) return
        val label = ev.options.getOrNull(index) ?: return
        startEvent("travel", "以果决的方式回应：$label")
    }

    fun endEvent() {
        val ev = _event.value ?: return
        streamJob?.cancel()
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
            s.copy(
                progress = s.progress + ev.progressGain,
                money = s.money + ev.moneyGain,
                inventory = inv,
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
    }

    fun canBreakthrough(): Boolean {
        val s = _state.value
        return s.tierIndex < 5 && s.progress >= WorldPacks.tierReq.getOrElse(s.tierIndex + 1) { Int.MAX_VALUE }
    }

    fun breakthrough() {
        if (!canBreakthrough()) {
            pushFeedback("修为不足，继续积累")
            return
        }
        val pack = _world.value
        _state.update { s ->
            s.copy(
                tierIndex = s.tierIndex + 1,
                sub = 0,
                progress = 0,
                power = s.power + 400 + s.tierIndex * 200,
                lifespan = s.lifespan + 40,
                events = listOf(
                    com.lvjie.nativeapp.data.BigEvent("${s.age} 岁", "${pack.advance}成功 · ${pack.tiers[(s.tierIndex + 1).coerceAtMost(pack.tiers.lastIndex)]}")
                ) + s.events,
            )
        }
        _breakthrough.value = pack.advance + "成功 · " + pack.tiers[_state.value.tierIndex.coerceAtMost(pack.tiers.lastIndex)]
    }

    fun dismissBreakthrough() { _breakthrough.value = null }

    fun clearFeedback() { _feedback.value = null }

    private fun pushFeedback(msg: String, big: Boolean = false) {
        _feedback.value = Feedback(msg, big)
    }

    private fun stream(full: String) {
        streamJob?.cancel()
        streamJob = viewModelScope.launch {
            _event.update { it?.copy(loading = true) }
            delay(280)
            var i = 0
            while (i < full.length) {
                i = if (full[i] == '<') {
                    val close = full.indexOf('>', i)
                    if (close >= 0) close + 1 else full.length
                } else i + 1
                val slice = full.substring(0, i)
                _event.update { it?.copy(shownText = slice, loading = false) }
                val pause = if (i < full.length && (full[i] == '，' || full[i] == '。' || full[i] == '！' || full[i] == '？')) 40L else 16L
                delay(pause)
            }
            _event.update { it?.copy(shownText = full, streaming = false, loading = false) }
        }
    }

    /** 提示词组装占位：真实接入 LLM 时替换 */
    suspend fun composePrompt(actionId: String): String = withContext(Dispatchers.Default) {
        val s = _state.value
        val w = _world.value
        buildString {
            appendLine("世界观：${w.name}（${w.tagline}）")
            appendLine("角色：${s.name}，${w.tiers.getOrElse(s.tierIndex) { "?" }}")
            appendLine("地点：${w.places.firstOrNull { it.id == s.loc }?.name ?: ""}")
            appendLine("行动：$actionId")
            appendLine("风格：${s.aiStyle}")
        }
    }
}
