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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.data.PlayerState
import com.lvjie.nativeapp.data.WorldPack
import com.lvjie.nativeapp.ui.components.*
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors
import com.lvjie.nativeapp.ui.theme.Radius

/** P10/P11 囊务 = 任务 + 行囊 */
@Composable
fun BagScreen(state: PlayerState, pack: WorldPack, onUseItem: (Int) -> Unit) {
    val c = LocalLvjieColors.current
    var mode by remember { mutableStateOf("quests") }
    val activeQuests = state.quests.count { it.status == "active" }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                SegBtn("任务 $activeQuests", mode == "quests") { mode = "quests" }
                SegBtn("行囊 ${state.inventory.size}", mode == "bag") { mode = "bag" }
            }
        }
        if (mode == "quests") {
            items(state.quests) { q ->
                val tone = when (q.status) {
                    "active" -> ChipTone.Warning
                    "done" -> ChipTone.Success
                    else -> ChipTone.Error
                }
                val label = when (q.status) {
                    "active" -> "进行中"; "done" -> "已完成"; else -> "失败"
                }
                ListItem(
                    icon = if (q.status == "done") "✅" else "📜",
                    title = q.title,
                    subtitle = "委托人：${q.from} · ${q.desc}",
                    trail = { LvjieChip(label, tone = tone) },
                )
            }
        } else {
            items(state.inventory.size) { idx ->
                val it = state.inventory[idx]
                val icon = when (it.type) {
                    "consumable" -> "🧪"; "equip" -> "🗡"; "technique" -> "📜"; else -> "📦"
                }
                ListItem(
                    icon = icon,
                    title = "${it.name} ×${it.count}",
                    subtitle = it.desc,
                    trail = {
                        if (it.type == "consumable") {
                            LvjieButton("使用", onClick = { onUseItem(idx) }, style = BtnStyle.Tonal, small = true)
                        }
                    },
                )
            }
        }
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.SegBtn(text: String, on: Boolean, onClick: () -> Unit) {
    val c = LocalLvjieColors.current
    Box(
        modifier = Modifier
            .weight(1f)
            .height(40.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(if (on) c.world.soft else c.surface3)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = if (on) c.world.deep else c.ink3, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

/** P12 设置 */
@Composable
fun SettingsScreen(
    state: PlayerState,
    pack: WorldPack,
    onAiStyle: (String) -> Unit,
    onToggleLimit: () -> Unit,
    onToggleBgm: () -> Unit,
    onApi: () -> Unit,
    onExport: () -> Unit,
    onDelete: () -> Unit,
) {
    val c = LocalLvjieColors.current
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("AI 叙事", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("沉浸", "简练", "诙谐").forEach { s ->
                        LvjieButton(s, onClick = { onAiStyle(s) }, style = if (state.aiStyle == s) BtnStyle.Primary else BtnStyle.Ghost, small = true)
                    }
                }
            }
        }
        item {
            LvjieCard {
                SettingRow("对话轮数限制", "开启后单次事件约 10 轮收束") {
                    LvjieSwitch(state.dialogLimit, onToggleLimit)
                }
            }
        }
        item {
            LvjieCard {
                SettingRow("背景音乐", "内置曲目 · 自定义 mp3") {
                    LvjieSwitch(state.bgm, onToggleBgm)
                }
            }
        }
        item {
            LvjieCard {
                SettingRow("模型与 API", "chat 协议 · gpt-mini") {
                    LvjieButton("管理", onClick = onApi, style = BtnStyle.Outline, small = true)
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("存档", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton("导出 JSON", onClick = onExport, style = BtnStyle.Outline, small = true)
                    LvjieButton("删除本世界", onClick = onDelete, style = BtnStyle.Danger, small = true)
                }
                Spacer(Modifier.height(8.dp))
                Text("导出不含 API Key。删除只影响当前世界存档。", color = c.ink3, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun SettingRow(title: String, desc: String, trail: @Composable () -> Unit) {
    val c = LocalLvjieColors.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(desc, color = c.ink3, fontSize = 11.sp)
        }
        trail()
    }
}

/** P04 API 设置 */
@Composable
fun ApiScreen(onBack: () -> Unit, onTest: () -> Unit) {
    val c = LocalLvjieColors.current
    var baseUrl by remember { mutableStateOf("https://api.example.com/v1") }
    var model by remember { mutableStateOf("gpt-mini") }
    var key by remember { mutableStateOf("sk-demo-key") }
    var chat by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("协议", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton("chat", onClick = { chat = true }, style = if (chat) BtnStyle.Primary else BtnStyle.Ghost, small = true)
                    LvjieButton("response", onClick = { chat = false }, style = if (!chat) BtnStyle.Primary else BtnStyle.Ghost, small = true)
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    if (chat) "POST {Base URL}/chat/completions" else "POST {Base URL}/responses",
                    color = c.ink3, fontSize = 11.sp,
                )
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("连接配置", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = baseUrl, onValueChange = { baseUrl = it },
                    label = { Text("Base URL") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = model, onValueChange = { model = it },
                    label = { Text("模型名") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = key, onValueChange = { key = it },
                    label = { Text("API Key") }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                )
                Spacer(Modifier.height(6.dp))
                Text("Keystore AES-256-GCM 加密保存；导出存档不含 Key。", color = c.ink3, fontSize = 11.sp)
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton("测试连通", onClick = onTest, style = BtnStyle.Outline, small = true)
                    LvjieButton("返回", onClick = onBack, style = BtnStyle.Ghost, small = true)
                }
            }
        }
    }
}
