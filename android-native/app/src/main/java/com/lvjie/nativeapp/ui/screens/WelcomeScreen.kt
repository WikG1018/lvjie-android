package com.lvjie.nativeapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.data.WorldPacks
import com.lvjie.nativeapp.ui.components.*
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors
import com.lvjie.nativeapp.ui.theme.Radius

/**
 * P01 欢迎 · 世界选择
 * 世界卡片改为 LazyColumn 内的两列流式行，避免嵌套网格被裁切/遮挡。
 */
@Composable
fun WelcomeScreen(
    strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"),
    selectedId: String,
    onSelectWorld: (String) -> Unit,
    onStart: () -> Unit,
    onContinue: () -> Unit,
    onDetail: () -> Unit,
    onAuthor: () -> Unit,
    onApi: () -> Unit,
    onHelp: () -> Unit,
    customPacks: List<com.lvjie.nativeapp.data.CustomPack> = emptyList(),
    onDeleteCustom: (String) -> Unit = {},
    saveName: String = "",
    saveLevel: String = "",
    savePlace: String = "",
    hasSave: Boolean = false,
) {
    val c = LocalLvjieColors.current
    val pack = WorldPacks.byId(selectedId)
    val rows = WorldPacks.all.chunked(2)

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
                    .background(Brush.linearGradient(listOf(pack.colors.soft, c.surface)))
                    .padding(22.dp)
            ) {
                Text(
                    "MAP OF WORLDS",
                    color = pack.colors.accent,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.14f.sp,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "地图上的${pack.name}世界",
                    color = c.ink,
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.025f).sp,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "选择你的旅程，AI 即时编织剧情。各世界存档互不影响。",
                    color = c.ink2,
                    fontSize = 13.sp,
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton(strings.startJourney, onClick = onStart)
                    LvjieButton("🛠 " + strings.customWorld, onClick = onAuthor, style = BtnStyle.Outline)
                }
            }
        }

        item { SectionLabel("世界收藏 · 点击切换主题（${WorldPacks.all.size}）") }

        items(rows.size) { index ->
            val pair = rows[index]
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                val w0 = pair[0]
                WorldCard(
                    w = w0,
                    selected = w0.id == selectedId,
                    onClick = { onSelectWorld(w0.id) },
                    modifier = Modifier.weight(1f),
                )
                if (pair.size > 1) {
                    val w1 = pair[1]
                    WorldCard(
                        w = w1,
                        selected = w1.id == selectedId,
                        onClick = { onSelectWorld(w1.id) },
                        modifier = Modifier.weight(1f),
                    )
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }
        }

        if (customPacks.isNotEmpty()) {
            item { SectionLabel("自定义世界 · ${customPacks.size}") }
            items(customPacks.size) { i ->
                val cp = customPacks[i]
                LvjieCard(onClick = { onSelectWorld(cp.id) }) {
                    ListItem(
                        icon = "🛠",
                        title = cp.name,
                        subtitle = "${cp.tagline.take(18)} · ${cp.tiers.size} 阶 · ${cp.placeNames.size} 地点",
                        trail = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                LvjieChip(if (selectedId == cp.id) "已选" else "选用", selected = selectedId == cp.id)
                                Spacer(Modifier.width(6.dp))
                                Text("×", color = c.ink3, fontSize = 16.sp, modifier = Modifier.clickable { onDeleteCustom(cp.id) })
                            }
                        },
                        onClick = { onSelectWorld(cp.id) },
                    )
                }
            }
        }

        item {
            LvjieCard(onClick = { if (hasSave) onContinue() else onStart() }) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ListItem(
                        icon = "💾",
                        title = if (hasSave) strings.continueLast else strings.noSave,
                        subtitle = if (hasSave) "$saveName · $saveLevel · $savePlace" else "点「开始旅程」创建角色",
                        modifier = Modifier.weight(1f).background(c.surface),
                        trail = { LvjieChip(if (hasSave) "继续" else "新档", selected = true) },
                        onClick = { if (hasSave) onContinue() else onStart() },
                    )
                }
            }
        }

        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LvjieButton(strings.worldDetail, onClick = onDetail, style = BtnStyle.Ghost, small = true)
                LvjieButton(strings.api, onClick = onApi, style = BtnStyle.Ghost, small = true)
                LvjieButton(strings.help, onClick = onHelp, style = BtnStyle.Ghost, small = true)
            }
        }

        // 底部留出安全区，避免最后一项被手势条贴住
        item { Spacer(Modifier.height(8.dp)) }
    }
}

@Composable
private fun WorldCard(
    w: WorldPack,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = LocalLvjieColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(Radius.Lg))
            .background(if (selected) w.colors.soft else c.surface)
            .border(
                width = if (selected) 1.5.dp else 1.dp,
                color = if (selected) w.colors.accent else c.line,
                shape = RoundedCornerShape(Radius.Lg),
            )
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(w.colors.soft),
            contentAlignment = Alignment.Center,
        ) {
            Text(w.icon, fontSize = 21.sp)
        }
        Spacer(Modifier.height(10.dp))
        Text(w.name, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        Text(w.tagline, color = c.ink3, fontSize = 11.sp, maxLines = 1)
        Spacer(Modifier.height(8.dp))
        Text(
            "${w.level} · ${w.progress} · ${w.tiers.size} 阶",
            color = c.ink3,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}
