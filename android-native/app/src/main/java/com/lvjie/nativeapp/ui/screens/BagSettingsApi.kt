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
fun BagScreen(strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"), state: PlayerState, pack: WorldPack, onUseItem: (Int) -> Unit) {
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
                SegBtn(strings.tasks + " " + activeQuests, mode == "quests") { mode = "quests" }
                SegBtn(strings.inventory + " " + state.inventory.size, mode == "bag") { mode = "bag" }
            }
        }
        if (mode == "quests") {
            if (state.quests.isEmpty()) {
                item { EmptyState("📜", strings.emptyTasks, strings.tasks) }
            }
            items(state.quests) { q ->
                val tone = when (q.status) {
                    "active" -> ChipTone.Warning
                    "done" -> ChipTone.Success
                    else -> ChipTone.Error
                }
                val label = when (q.status) {
                    "active" -> strings.questStatusActive
                    "done" -> strings.questStatusDone
                    else -> strings.questStatusFailed
                }
                ListItem(
                    icon = if (q.status == "done") "✅" else "📜",
                    title = q.title,
                    subtitle = "${q.from} · ${q.desc}",
                    trail = { LvjieChip(label, tone = tone) },
                )
            }
        } else {
            if (state.inventory.isEmpty()) {
                item { EmptyState("🎒", strings.emptyBag, strings.inventory) }
            }
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
                            LvjieButton(strings.use, onClick = { onUseItem(idx) }, style = BtnStyle.Tonal, small = true)
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
    strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"),
    state: PlayerState,
    pack: WorldPack,
    onAiStyle: (String) -> Unit,
    onLang: (String) -> Unit,
    onToggleLimit: () -> Unit,
    onToggleBgm: () -> Unit,
    onApi: () -> Unit,
    onExport: () -> Unit,
    onImport: (String) -> Unit,
    onDelete: () -> Unit,
) {
    val c = LocalLvjieColors.current
    var showImport by remember { mutableStateOf(false) }
    var importText by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.aiStyle, fontSize = 15.sp, fontWeight = FontWeight.Bold)
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.language, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("简体中文", "繁體中文", "English", "日本語").forEach { s ->
                        LvjieButton(s, onClick = { onLang(s) }, style = if (state.lang == s) BtnStyle.Primary else BtnStyle.Ghost, small = true)
                    }
                }
                Spacer(Modifier.height(8.dp))
                Text("影响 UI 文案与 AI 叙事输出语言。", color = c.ink3, fontSize = 11.sp)
            }
        }
        item {
            LvjieCard {
                SettingRow(strings.dialogLimit, "开启后单次事件约 10 轮收束") {
                    LvjieSwitch(state.dialogLimit, onToggleLimit)
                }
            }
        }
        item {
            LvjieCard {
                SettingRow(strings.bgm, "内置环境音乐，可随时开关") {
                    LvjieSwitch(state.bgm, onToggleBgm)
                }
            }
        }
        item {
            LvjieCard {
                SettingRow(strings.api, "chat / response · 可配 Base URL 与 Key") {
                    LvjieButton("管理", onClick = onApi, style = BtnStyle.Outline, small = true)
                }
            }
        }
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.inventory, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Box(Modifier.size(7.dp).clip(CircleShape).background(c.world.accent))
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton(strings.export, onClick = onExport, style = BtnStyle.Outline, small = true)
                    LvjieButton(strings.importSave, onClick = { showImport = true }, style = BtnStyle.Outline, small = true)
                    LvjieButton(strings.deleteWorld, onClick = onDelete, style = BtnStyle.Danger, small = true)
                }
                Spacer(Modifier.height(8.dp))
                Text("导出为 JSON（不含 API Key），可分享或备份。删除只影响《${pack.name}》存档。", color = c.ink3, fontSize = 11.sp)
            }
        }
    }

    if (showImport) {
        AlertDialog(
            onDismissRequest = { showImport = false },
            title = { Text(strings.importJson) },
            text = {
                Column {
                    Text(strings.importHint, fontSize = 12.sp, color = c.ink2)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = importText,
                        onValueChange = { importText = it },
                        modifier = Modifier.fillMaxWidth().height(140.dp),
                        placeholder = { Text("{saves:{...}}", fontSize = 12.sp) },
                        shape = RoundedCornerShape(Radius.Md),
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    showImport = false
                    onImport(importText)
                    importText = ""
                }) { Text(strings.importBtn) }
            },
            dismissButton = {
                TextButton(onClick = { showImport = false }) { Text(strings.cancel) }
            },
        )
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
fun ApiScreen(
    strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文"),
    config: com.lvjie.nativeapp.llm.LlmConfig,
    models: List<String>,
    onBack: () -> Unit,
    onTest: (baseUrl: String, model: String, key: String, protocol: String) -> Unit,
    onRefreshModels: (baseUrl: String, model: String, key: String, protocol: String) -> Unit,
    onSave: (baseUrl: String, model: String, key: String, protocol: String) -> Unit,
) {
    val c = LocalLvjieColors.current
    var baseUrl by remember { mutableStateOf(config.baseUrl) }
    var model by remember { mutableStateOf(config.model) }
    var key by remember { mutableStateOf(config.apiKey) }
    var keyVisible by remember { mutableStateOf(false) }
    var chat by remember { mutableStateOf(config.protocol == "chat") }
    LaunchedEffect(Unit) {
        baseUrl = config.baseUrl
        model = config.model
        key = config.apiKey
        chat = config.protocol == "chat"
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp),
        contentPadding = PaddingValues(vertical = 12.dp, horizontal = 2.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            LvjieCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(strings.protocol, fontSize = 15.sp, fontWeight = FontWeight.Bold)
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
                    label = { Text(strings.baseUrl) }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = model, onValueChange = { model = it },
                    label = { Text(strings.modelName) }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = key, onValueChange = { key = it },
                    label = { Text(strings.apiKey) }, modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radius.Md), singleLine = true,
                    visualTransformation = if (keyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        TextButton(onClick = { keyVisible = !keyVisible }) {
                            Text(if (keyVisible) strings.hide else strings.show, fontSize = 11.sp)
                        }
                    },
                )
                Spacer(Modifier.height(6.dp))
                Text(strings.keyHint, color = c.ink3, fontSize = 11.sp)
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LvjieButton(strings.save, onClick = { onSave(baseUrl, model, key, if (chat) "chat" else "response") }, small = true)
                    LvjieButton(strings.test, onClick = { onTest(baseUrl, model, key, if (chat) "chat" else "response") }, style = BtnStyle.Outline, small = true)
                    LvjieButton(strings.refreshModels, onClick = { onRefreshModels(baseUrl, model, key, if (chat) "chat" else "response") }, style = BtnStyle.Outline, small = true)
                }
                if (models.isNotEmpty()) {
                    Spacer(Modifier.height(8.dp))
                    Text("可用模型（点选填入）", color = c.ink3, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    models.take(8).forEach { m ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { model = m }
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            LvjieChip(if (m == model) "✓ 当前" else "选用", selected = m == model)
                            Spacer(Modifier.width(8.dp))
                            Text(m, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}
