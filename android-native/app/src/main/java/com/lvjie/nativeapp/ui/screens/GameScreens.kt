package com.lvjie.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
    state: PlayerState,
    pack: WorldPack,
    event: EventUi?,
    onAction: (String) -> Unit,
    onTalk: (String) -> Unit,
    onOption: (Int) -> Unit,
    onEndEvent: () -> Unit,
    onFreeText: (String) -> Unit,
) {
    val c = LocalLvjieColors.current
    val place = pack.places.firstOrNull { it.id == state.loc } ?: pack.places.first()
    var free by remember { mutableStateOf("") }

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
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
                    pack.actions.forEach { a ->
                        LvjieButton(a.label, onClick = { onAction(a.id) }, style = BtnStyle.Tonal, small = true)
                    }
                }
            }
        }

        if (event != null) {
            item {
                EventCard(
                    event = event,
                    onOption = onOption,
                    onEnd = onEndEvent,
                    free = free,
                    onFreeChange = { free = it },
                    onSend = {
                        if (free.isNotBlank()) {
                            onFreeText(free.trim())
                            free = ""
                        }
                    },
                )
            }
        }

        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("场景中的人", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                if (place.people.isEmpty()) {
                    EmptyState("🍃", "此处暂无他人", "换一个行动或移动到别处")
                } else {
                    place.people.forEach { name ->
                        ListItem(
                            icon = "👤", title = name, subtitle = "点击可交谈",
                            modifier = Modifier.padding(vertical = 4.dp),
                            trail = { LvjieButton("交谈", onClick = { onTalk(name) }, style = BtnStyle.Tonal, small = true) },
                            onClick = { onTalk(name) },
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
    event: EventUi,
    onOption: (Int) -> Unit,
    onEnd: () -> Unit,
    free: String,
    onFreeChange: (String) -> Unit,
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
            LvjieButton("结束事件", onClick = onEnd, style = BtnStyle.Ghost, small = true)
        }
        Spacer(Modifier.height(8.dp))
        if (event.loading && event.shownText.isEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("正在生成", color = c.ink3, fontSize = 13.sp)
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
        if (!event.streaming && event.options.isNotEmpty()) {
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
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = free,
                onValueChange = onFreeChange,
                modifier = Modifier.weight(1f).height(48.dp),
                placeholder = { Text("描述你想做的事…", fontSize = 12.sp) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = c.world.accent, unfocusedBorderColor = c.line),
            )
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .background(c.world.accent)
                    .clickable(onClick = onSend)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) { Text("发送", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
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

fun canBreak(state: PlayerState): Boolean =
    state.tierIndex < 5 && state.progress >= reqFor(state)

/** P07 地图 */
@Composable
fun MapScreen(state: PlayerState, pack: WorldPack, onMove: (String) -> Unit) {
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
                        Text("当前 · ${pack.places.firstOrNull { it.id == state.loc }?.name ?: ""}", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("${pack.name}界 · ${pack.places.firstOrNull { it.id == state.loc }?.world ?: ""}", color = c.ink3, fontSize = 11.sp)
                    }
                }
            }
        }
        item { SectionLabel("${pack.icon} ${pack.name}界 · ${pack.places.size} 地点") }
        items(pack.places) { p ->
            val cur = p.id == state.loc
            ListItem(
                icon = if (cur) "📍" else when (p.type) {
                    "秘境" -> "🏯"; "荒野", "险地", "野外" -> "⛰"; "渡口" -> "🌊"; else -> "🏙"
                },
                title = p.name + if (cur) " · 当前" else "",
                subtitle = "${p.type} · " + if (p.people.isEmpty()) "无人" else "${p.people.size} 人",
                modifier = if (cur) Modifier.border(1.5.dp, c.world.accent, RoundedCornerShape(Radius.Md)) else Modifier,
                trail = { LvjieChip(if (cur) "在此" else "前往", selected = cur) },
                onClick = { if (!cur) onMove(p.id) },
            )
        }
    }
}

/** P08 人物 */
@Composable
fun ProfileScreen(state: PlayerState, pack: WorldPack, onBreakthrough: () -> Unit) {
    val c = LocalLvjieColors.current
    val can = canBreak(state)
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
                StatCell("战力", state.power.toString(), Modifier.weight(1f))
                StatCell("年龄", "${state.age} 岁", Modifier.weight(1f))
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatCell(pack.money, state.money.toString(), Modifier.weight(1f))
                StatCell("技艺", "4 项", Modifier.weight(1f))
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("重大经历", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                state.events.forEach { e ->
                    ListItem(icon = "✦", title = e.age, subtitle = e.text, modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
    }
}
