package com.lvjie.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.engine.EventUi
import com.lvjie.nativeapp.ui.components.*
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors
import com.lvjie.nativeapp.ui.theme.Radius

/** P06 主场景 · 叙事 */
@Composable
fun SceneScreen(
    strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"),
    state: PlayerState,
    pack: WorldPack,
    event: EventUi?,
    onAction: (String) -> Unit,
    onTalk: (String) -> Unit,
    onOption: (Int) -> Unit,
    onEndEvent: () -> Unit,
    onFreeText: (String) -> Unit,
    onHint: (String) -> Unit = {},
) {
    val c = LocalLvjieColors.current
    val place = pack.places.firstOrNull { it.id == state.loc } ?: pack.places.first()
    var free by androidx.compose.runtime.saveable.rememberSaveable { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            LvjieCard(hero = true) {
                Row(verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) {
                        Text(place.name, fontSize = 17.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.02f).sp)
                        Text("${pack.name}界 · ${place.world} · ${place.type}", color = c.ink3, fontSize = 11.sp)
                    }
                    LvjieChip("${pack.icon} ${tierLabel(state, pack)}", selected = true)
                }
                Spacer(Modifier.height(8.dp))
                Text(place.desc, color = c.ink2, fontSize = 12.5.sp, lineHeight = 20.sp)
                Spacer(Modifier.height(12.dp))
                val busy = event?.loading == true || event?.streaming == true
                LvjieFlow {
                    pack.actions.forEach { a ->
                        LvjieButton(a.label, onClick = { if (!busy) onAction(a.id) }, style = BtnStyle.Tonal, small = true, enabled = !busy)
                    }
                }
            }
        }

        if (event != null) {
            item {
                EventCard(
                    strings = strings,
                    event = event,
                    onOption = onOption,
                    onEnd = onEndEvent,
                    free = free,
                    onFreeChange = { free = it },
                    enabled = !event.streaming,
                    onSend = {
                        val text = free.trim()
                        if (text.isEmpty()) {
                            onHint("先输入要做的事")
                        } else {
                            onFreeText(text)
                            free = ""
                        }
                    },
                )
            }
        }

        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.scenePeople, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                if (place.people.isEmpty()) {
                    EmptyState("🍃", strings.noPeople, strings.noPeopleHint)
                } else {
                    place.people.forEach { name ->
                        ListItem(
                            icon = "👤", title = name, subtitle = strings.talk,
                            modifier = Modifier.padding(vertical = 4.dp),
                            trail = { LvjieButton(strings.talk, onClick = { onTalk(name) }, style = BtnStyle.Tonal, small = true) },
                            onClick = { onTalk(name) },
                        )
                    }
                }
            }
        }

        val beasts = place.beasts.filter { beast -> named(beast.name) && beast.name.trim() != "未知生物" }
        if (beasts.isNotEmpty()) {
            item {
                LvjieCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("生物", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                        Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                    }
                    Spacer(Modifier.height(10.dp))
                    beasts.forEach { beast ->
                        ListItem(
                            icon = "⚔",
                            title = beast.name.trim(),
                            subtitle = beastDetail(beast.realm, beast.power, beast.drops),
                            modifier = Modifier.padding(vertical = 4.dp),
                        )
                    }
                }
            }
        }
        val interactables = place.interactables.filter { spot -> named(spot.name) && spot.name.trim() != "未知" }
        if (interactables.isNotEmpty()) {
            item {
                LvjieCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("可交互", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                        Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                    }
                    Spacer(Modifier.height(10.dp))
                    interactables.forEach { spot ->
                        ListItem(
                            icon = "🔍",
                            title = spot.name.trim(),
                            subtitle = spot.intro.trim().ifBlank { "在此" }.let { if (it == "未知") "在此" else it },
                            modifier = Modifier.padding(vertical = 4.dp),
                        )
                    }
                }
            }
        }

        item {
            LvjieCard {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(pack.progress, color = c.ink3, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    Text("${state.progress} / ${reqFor(state)}", color = c.world.accent, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(8.dp))
                val pct = state.progress.toFloat() / reqFor(state).coerceAtLeast(1)
                ProgressBar(pct, full = pct >= 1f)
            }
        }
    }
}

@Composable
private fun EventCard(
    strings: com.lvjie.nativeapp.i18n.UiStrings,
    event: EventUi,
    onOption: (Int) -> Unit,
    onEnd: () -> Unit,
    free: String,
    onFreeChange: (String) -> Unit,
    enabled: Boolean = true,
    onSend: () -> Unit,
) {
    val c = LocalLvjieColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radius.Lg))
            .background(c.surface)
            .border(1.dp, c.world.soft, RoundedCornerShape(Radius.Lg))
            .padding(14.dp)
    ) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("${event.kind} · 第 ${event.count} 轮", color = c.world.accent, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.04f.sp)
            LvjieButton(strings.endEvent, onClick = onEnd, style = BtnStyle.Ghost, small = true)
        }
        Spacer(Modifier.height(8.dp))
        if (event.loading && event.shownText.isEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(strings.generating, color = c.ink3, fontSize = 13.sp)
                Spacer(Modifier.width(8.dp))
                Dots()
            }
        } else {
            Text(event.shownText, color = c.ink, fontSize = 14.sp, lineHeight = 26.sp)
            if (event.streaming) {
                Spacer(Modifier.width(2.dp))
                Box(Modifier.size(2.dp, 14.dp).background(c.world.accent))
            }
        }
        if (!event.streaming && event.options.isNotEmpty() && !event.loading) {
            Spacer(Modifier.height(8.dp))
            event.options.forEachIndexed { i, opt ->
                val isPrimary = i == 0
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isPrimary) c.world.soft else c.surface2)
                        .then(if (!isPrimary) Modifier.border(1.dp, c.line, RoundedCornerShape(16.dp)) else Modifier)
                        .clickable { onOption(i) }
                        .padding(13.dp)
                ) {
                    Text("${i + 1}. $opt", color = if (isPrimary) c.world.deep else c.ink2, fontSize = 13.5.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
        val turnSettled = !event.streaming && !event.loading
        val showFree = turnSettled && event.options.isEmpty()
        if (showFree) {
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = free,
                    onValueChange = onFreeChange,
                    modifier = Modifier.weight(1f).height(48.dp),
                    placeholder = { Text(strings.freeInputHint, fontSize = 12.sp) },
                    singleLine = true,
                    enabled = enabled,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = c.world.accent, unfocusedBorderColor = c.line),
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(c.world.accent)
                        .clickable(enabled = enabled, onClick = onSend)
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                ) { Text(strings.send, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
            }
        }
    }
}

@Composable
fun Dots() {
    val c = LocalLvjieColors.current
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        repeat(3) { i ->
            Box(
                Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(c.world.accent.copy(alpha = 0.35f + i * 0.2f))
            )
        }
    }
}

fun tierLabel(state: PlayerState, pack: WorldPack): String {
    val t = pack.tiers.getOrElse(state.tierIndex) { "?" }
    val sub = listOf("初期", "中期", "后期").getOrElse(state.sub) { "" }
    return "$t · $sub"
}

fun reqFor(state: PlayerState): Int {
    val req = com.lvjie.nativeapp.data.WorldPacks.tierReq
    return req.getOrElse(state.tierIndex + 1) { req.last() }
}

fun canBreak(state: PlayerState, pack: WorldPack): Boolean =
    state.tierIndex < pack.tiers.lastIndex && state.progress >= reqFor(state)

/** P07 地图 */
@Composable
fun MapScreen(strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"), state: PlayerState, pack: WorldPack, onMove: (String) -> Unit) {
    val c = LocalLvjieColors.current
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            LvjieCard(
                modifier = Modifier.border(1.5.dp, c.world.accent, RoundedCornerShape(Radius.Lg)),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(strings.currentLocation + " · ${pack.places.firstOrNull { it.id == state.loc }?.name ?: ""}", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("${pack.name}界 · ${pack.places.firstOrNull { it.id == state.loc }?.world ?: ""}", color = c.ink3, fontSize = 11.sp)
                    }
                }
            }
        }
        item { SectionLabel("${pack.icon} ${pack.name}界 · ${pack.places.size} 地点") }
        items(pack.places) { p ->
            val cur = p.id == state.loc
            val beasts = p.beasts.filter { named(it.name) && it.name.trim() != "未知生物" }
            val interactables = p.interactables.filter { named(it.name) && it.name.trim() != "未知" }
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                ListItem(
                    icon = if (cur) "📍" else when (p.type) {
                        "秘境" -> "🏯"; "荒野", "险地", "野外" -> "⛰"; "渡口" -> "🌊"; else -> "🏙"
                    },
                    title = p.name + if (cur) " · 当前" else "",
                    subtitle = "${p.type} · " + if (p.people.isEmpty()) "无人" else "${p.people.size} 人",
                    modifier = if (cur) Modifier.border(1.5.dp, c.world.accent, RoundedCornerShape(Radius.Md)) else Modifier,
                    trail = { LvjieChip(if (cur) strings.here else strings.go, selected = cur) },
                    onClick = if (cur) null else { { onMove(p.id) } },
                )
                if (beasts.isNotEmpty() || interactables.isNotEmpty()) {
                    Text(
                        listOfNotNull(
                            beasts.takeIf { it.isNotEmpty() }?.joinToString("、") { it.name.trim() }?.let { "生物 $it" },
                            interactables.takeIf { it.isNotEmpty() }?.joinToString("、") { it.name.trim() }?.let { "可交互 $it" },
                        ).joinToString(" · "),
                        color = c.ink3,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 4.dp),
                    )
                }
            }
        }
    }
}

/** P08 人物 */
@Composable
fun ProfileScreen(
    strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"),
    state: PlayerState,
    pack: WorldPack,
    onBreakthrough: () -> Unit,
    onPropose: (String) -> Unit = {},
    onToggleTravel: (String) -> Unit = {},
    onSpar: (String) -> Unit = {},
    teamPower: String = "",
    ageText: String = "",
    onEndTravel: (String, Boolean) -> Unit = { _, _ -> },
    onDismissAll: (Boolean) -> Unit = {},
) {
    val c = LocalLvjieColors.current
    val can = canBreak(state, pack)
    var endName by remember { mutableStateOf<String?>(null) }
    var dismissAll by remember { mutableStateOf(false) }
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(Radius.Hero))
                    .background(Brush.linearGradient(listOf(c.world.soft, c.surface)))
                    .padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(pack.icon, fontSize = 42.sp)
                Text(state.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.02f).sp)
                Text("${pack.name}界旅者", color = c.ink3, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
                LvjieChip(tierLabel(state, pack), selected = true)
                Spacer(Modifier.height(12.dp))
                val pct = state.progress.toFloat() / reqFor(state).coerceAtLeast(1)
                ProgressBar(pct, full = can)
                Spacer(Modifier.height(6.dp))
                Text("${pack.progress} ${state.progress} / ${reqFor(state)}", color = c.ink3, fontSize = 11.sp)
                Spacer(Modifier.height(12.dp))
                LvjieButton(pack.advance, onClick = onBreakthrough, enabled = can)
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCell(strings.power, state.power.toString(), Modifier.weight(1f))
                StatCell("队伍战力", teamPower, Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCell(strings.age, ageText, Modifier.weight(1f))
                StatCell(pack.money.ifBlank { "币" }, state.money.toString(), Modifier.weight(1f))
            }
        }
        if (state.moneyMid > 0 || state.moneyHigh > 0 || state.moneyPeak > 0) {
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCell(pack.moneyMid.ifBlank { "中" }, state.moneyMid.toString(), Modifier.weight(1f))
                    StatCell(pack.moneyHigh.ifBlank { "高" }, state.moneyHigh.toString(), Modifier.weight(1f))
                }
            }
        }
        if (state.moneyPeak > 0) {
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatCell(pack.moneyPeak.ifBlank { "极品" }, state.moneyPeak.toString(), Modifier.weight(1f))
                    StatCell(strings.level, pack.tiers.getOrElse(state.tierIndex) { "?" }, Modifier.weight(1f))
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.companions, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                    Spacer(Modifier.weight(1f))
                    Text("${state.friends.size} 人", color = c.ink3, fontSize = 11.sp)
                }
                Spacer(Modifier.height(10.dp))
                if (state.friends.any { it.traveling }) {
                    LvjieFlow {
                        LvjieButton("解散全队", onClick = { dismissAll = true }, style = BtnStyle.Outline, small = true)
                    }
                    Spacer(Modifier.height(10.dp))
                }
                if (state.friends.isEmpty()) {
                    EmptyState("🤝", strings.emptyCompanions, strings.talk)
                } else {
                    state.friends.forEach { f ->
                        Column(Modifier.padding(vertical = 4.dp)) {
                            ListItem(
                                icon = if (f.married) "💍" else "👤",
                                title = "${f.name} · ${f.rel}",
                                subtitle = "${f.at} · 好感 ${f.favor} · ${f.intro}",
                            )
                            Spacer(Modifier.height(6.dp))
                            LvjieFlow {
                                if (f.traveling) {
                                    LvjieButton("结束同行", onClick = { endName = f.name }, style = BtnStyle.Ghost, small = true)
                                    LvjieButton("切磋", onClick = { onSpar(f.name) }, style = BtnStyle.Tonal, small = true)
                                } else {
                                    LvjieButton("邀请同行", onClick = { onToggleTravel(f.name) }, style = BtnStyle.Ghost, small = true)
                                }
                                if (!f.married && pack.marriage) {
                                    LvjieButton("求婚", onClick = { onPropose(f.name) }, style = BtnStyle.Tonal, small = true)
                                }
                            }
                        }
                    }
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.majorEvents, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                if (state.events.isEmpty()) {
                    EmptyState("✦", strings.emptyEvents, strings.noEventsHint)
                } else {
                    state.events.forEach { e ->
                        ListItem(icon = "✦", title = e.age, subtitle = e.text, modifier = Modifier.padding(vertical = 4.dp))
                    }
                }
            }
        }
    }

    val ending = endName
    if (ending != null) {
        TravelChoiceDialog(
            title = "结束同行",
            body = "「$ending」要送回原处，还是留在原地？",
            onReturn = {
                onEndTravel(ending, true)
                endName = null
            },
            onStay = {
                onEndTravel(ending, false)
                endName = null
            },
            onCancel = { endName = null },
        )
    }
    if (dismissAll) {
        TravelChoiceDialog(
            title = "解散全队",
            body = "将解除全部同行者。要送回原处，还是留在原地？",
            onReturn = {
                onDismissAll(true)
                dismissAll = false
            },
            onStay = {
                onDismissAll(false)
                dismissAll = false
            },
            onCancel = { dismissAll = false },
        )
    }
}

@Composable
private fun TravelChoiceDialog(
    title: String,
    body: String,
    onReturn: () -> Unit,
    onStay: () -> Unit,
    onCancel: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onCancel,
        title = { Text(title) },
        text = {
            Column {
                Text(body, fontSize = 13.sp)
                Spacer(Modifier.height(12.dp))
                LvjieFlow {
                    LvjieButton("送回原处", onClick = onReturn, small = true)
                    LvjieButton("留在原地", onClick = onStay, style = BtnStyle.Outline, small = true)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onCancel) { Text("取消") }
        },
    )
}

private fun named(raw: String): Boolean {
    val name = raw.trim()
    return name.isNotEmpty() && name != "未知" && name != "未知生物"
}

private fun beastDetail(realm: String, power: Int, drops: String): String =
    listOfNotNull(
        realm.trim().takeIf { it.isNotEmpty() && it != "未知" },
        if (power > 0) "战力 $power" else null,
        drops.trim().takeIf { it.isNotEmpty() && it != "未知" }?.let { "掉落 $it" },
    ).joinToString(" · ").ifBlank { "在此" }
