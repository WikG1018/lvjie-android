package com.lvjie.nativeapp.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.data.WorldPacks
import com.lvjie.nativeapp.ui.components.*
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors
import com.lvjie.nativeapp.ui.theme.Radius

/** P02 世界详情 */
@Composable
fun DetailScreen(pack: WorldPack, onStart: () -> Unit) {
    val c = LocalLvjieColors.current
    var tab by remember { mutableStateOf(0) }
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
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(pack.icon, fontSize = 44.sp)
                Spacer(Modifier.height(8.dp))
                Text(pack.name + "世界", fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text(pack.tagline, color = c.ink2, fontSize = 13.sp)
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("介绍", "等级表", "地图").forEachIndexed { i, t ->
                    LvjieButton(t, onClick = { tab = i }, style = if (tab == i) BtnStyle.Primary else BtnStyle.Ghost, small = true)
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("这个世界怎么玩", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "行动、对话、自由输入，AI 生成剧情并回写数值。等级名为「${pack.level}」，进度为「${pack.progress}」，货币为「${pack.money}」。",
                    color = c.ink2, fontSize = 13.sp, lineHeight = 22.sp,
                )
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("等级表", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    pack.tiers.forEachIndexed { i, t ->
                        LvjieChip(t, selected = i == 1)
                    }
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("地点预览", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(10.dp))
                pack.places.take(3).forEach { p ->
                    ListItem(icon = "📍", title = p.name, subtitle = "${p.type} · ${p.world}", modifier = Modifier.padding(vertical = 4.dp))
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                LvjieButton("进入世界", onClick = onStart, modifier = Modifier.weight(1f))
                LvjieButton("新开一局", onClick = onStart, style = BtnStyle.Outline, modifier = Modifier.weight(1f))
            }
        }
    }
}

/** P03 自定义世界工坊（四步向导） */
@Composable
fun AuthorScreen() {
    val c = LocalLvjieColors.current
    var step by remember { mutableStateOf(1) }
    val steps = listOf("来源", "设定", "生成", "微调")

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                steps.forEachIndexed { i, s ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(22.dp)
                                .clip(CircleShape)
                                .background(
                                    when {
                                        i + 1 == step -> c.world.accent
                                        i + 1 < step -> c.world.soft
                                        else -> c.surface3
                                    }
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                if (i + 1 < step) "✓" else "${i + 1}",
                                fontSize = 10.sp, fontWeight = FontWeight.Bold,
                                color = when {
                                    i + 1 == step -> Color.White
                                    i + 1 < step -> c.world.accent
                                    else -> c.ink3
                                },
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(s, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (i + 1 == step) c.world.deep else c.ink3)
                    }
                }
            }
        }
        item { SectionLabel("第 $step 步 / 共 4 步 · ${steps[step - 1]}") }

        when (step) {
            1 -> items(listOf(
                Triple("📚", "从作品生成", "书名 + 设定摘要"),
                Triple("📄", "整本小说", "上传 TXT · 抽样考据"),
                Triple("🌐", "联网补充设定", "百科 / 设定帖"),
                Triple("🧩", "粘贴 JSON", "高级 · schema 校验"),
            )) { (ic, t, d) ->
                ListItem(icon = ic, title = t, subtitle = d, onClick = { step = 2 })
            }
            2 -> item {
                LvjieCard {
                    Text("书名 / 世界名", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = c.ink3)
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(
                        value = "凡人修仙传", onValueChange = {}, modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(Radius.Md), singleLine = true,
                    )
                    Spacer(Modifier.height(12.dp))
                    Text("设定摘要", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = c.ink3)
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(
                        value = "凡人流修仙，资质平平的少年靠机缘与谋略步步登天。",
                        onValueChange = {}, modifier = Modifier.fillMaxWidth().height(88.dp),
                        shape = RoundedCornerShape(Radius.Md),
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LvjieButton("上一步", onClick = { step = 1 }, style = BtnStyle.Ghost, small = true)
                        LvjieButton("下一步 · 生成草稿", onClick = { step = 3 }, small = true)
                    }
                }
            }
            3 -> item {
                LvjieCard {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Dots()
                        Spacer(Modifier.height(12.dp))
                        Text("正在考据设定、合并世界观、生成草稿…", color = c.ink2, fontSize = 13.sp)
                        Spacer(Modifier.height(12.dp))
                        ProgressBar(0.62f)
                        Spacer(Modifier.height(16.dp))
                        LvjieButton("跳过（演示）", onClick = { step = 4 }, style = BtnStyle.Outline, small = true)
                    }
                }
            }
            else -> item {
                LvjieCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("草稿预览", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.width(8.dp))
                        Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                    }
                    Spacer(Modifier.height(8.dp))
                    Text("凡人修仙 · 等级 6 阶 · 地点 8 个 · NPC 12 人", color = c.ink2, fontSize = 13.sp)
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        pack.tiers.forEach { LvjieChip(it) }
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        LvjieButton("返回修改", onClick = { step = 2 }, style = BtnStyle.Ghost, small = true)
                        LvjieButton("保存世界", onClick = { step = 1 }, small = true)
                    }
                }
            }
        }
    }
}

private val pack get() = WorldPacks.all.first()

/** P05 帮助 */
@Composable
fun HelpScreen() {
    val c = LocalLvjieColors.current
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("快速开始", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("1 选世界", "2 点行动", "3 看剧情", "4 数值变").forEach {
                        StatCell("", it, Modifier.weight(1f))
                    }
                }
            }
        }
        item { SectionLabel("常见问题") }
        items(listOf(
            "什么是世界包？" to "世界包定义了等级、货币、地图、行动与 AI 铁律，可导入 JSON 或 AI 生成。",
            "AI 会犯错吗？" to "剧情由 AI 实时合成，可能存在虚构。数值落库有熔断保护。",
            "存档会丢吗？" to "按世界分槽本地保存，可导出 JSON 备份。清应用数据会丢失。",
            "Key 安全吗？" to "安卓端 Keystore AES-256-GCM 加密，不进导出文件。",
        )) { (q, a) ->
            LvjieCard {
                Text(q, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(6.dp))
                Text(a, color = c.ink2, fontSize = 12.sp, lineHeight = 19.sp)
            }
        }
    }
}
