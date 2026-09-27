package com.lvjie.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lvjie.nativeapp.engine.GameViewModel
import com.lvjie.nativeapp.ui.nav.GameBottomBar
import com.lvjie.nativeapp.ui.nav.GameTab
import com.lvjie.nativeapp.ui.screens.*
import com.lvjie.nativeapp.ui.theme.LvjieTheme
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val vm: GameViewModel = viewModel()
            val state by vm.state.collectAsStateWithLifecycle()
            val pack by vm.world.collectAsStateWithLifecycle()
            val event by vm.event.collectAsStateWithLifecycle()
            val feedback by vm.feedback.collectAsStateWithLifecycle()
            val breakthrough by vm.breakthrough.collectAsStateWithLifecycle()
            val llmConfig by vm.llmConfig.collectAsStateWithLifecycle()
            val models by vm.modelList.collectAsStateWithLifecycle()
            val exportJson by vm.exportJson.collectAsStateWithLifecycle()

            var screen by remember { mutableStateOf(AppScreen.Welcome) }
            var gameTab by remember { mutableStateOf(GameTab.Scene) }

            LvjieTheme(world = pack.colors) {
                AppRoot(
                    screen = screen,
                    gameTab = gameTab,
                    state = state,
                    pack = pack,
                    event = event,
                    feedback = feedback,
                    breakthrough = breakthrough,
                    llmConfig = llmConfig,
                    models = models,
                    exportJson = exportJson,
                    onScreen = { screen = it },
                    onGameTab = { gameTab = it },
                    vm = vm,
                )
            }
        }
    }
}

enum class AppScreen { Welcome, Detail, Author, Api, Help, Game }

@Composable
fun AppRoot(
    screen: AppScreen,
    gameTab: GameTab,
    state: com.lvjie.nativeapp.data.PlayerState,
    pack: com.lvjie.nativeapp.data.WorldPack,
    event: com.lvjie.nativeapp.engine.EventUi?,
    feedback: com.lvjie.nativeapp.engine.Feedback?,
    breakthrough: String?,
    llmConfig: com.lvjie.nativeapp.llm.LlmConfig,
    models: List<String>,
    exportJson: String?,
    onScreen: (AppScreen) -> Unit,
    onGameTab: (GameTab) -> Unit,
    vm: GameViewModel,
) {
    val c = LocalLvjieColors.current
    var showDelete by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize()) {
    Scaffold(
        containerColor = c.canvas,
        contentWindowInsets = WindowInsets.safeDrawing,
        topBar = {
            TopBar(
                screen = screen, pack = pack, state = state,
                onBack = { onScreen(AppScreen.Welcome) },
                modifier = Modifier.windowInsetsPadding(WindowInsets.statusBars),
            )
        },
        bottomBar = {
            if (screen == AppScreen.Game) {
                GameBottomBar(current = gameTab, onSelect = onGameTab)
            } else {
                OnboardBar(current = screen, onScreen = onScreen)
            }
        },
    ) { pad ->
        Box(Modifier.padding(pad).fillMaxSize()) {
            when (screen) {
                AppScreen.Welcome -> WelcomeScreen(
                    selectedId = pack.id,
                    onSelectWorld = { vm.selectWorld(it) },
                    onStart = {
                        vm.startGame(pack.id)
                        onScreen(AppScreen.Game)
                        onGameTab(GameTab.Scene)
                    },
                    onDetail = { onScreen(AppScreen.Detail) },
                    onAuthor = { onScreen(AppScreen.Author) },
                    onApi = { onScreen(AppScreen.Api) },
                    onHelp = { onScreen(AppScreen.Help) },
                )
                AppScreen.Detail -> DetailScreen(
                    pack = pack,
                    onStart = {
                        vm.startGame(pack.id)
                        onScreen(AppScreen.Game)
                        onGameTab(GameTab.Scene)
                    },
                )
                AppScreen.Author -> AuthorScreen(
                    onSaved = { name, tag, tiers, places ->
                        val id = "custom_" + System.currentTimeMillis()
                        vm.saveCustomPack(id, name, tag, tiers, places)
                        onScreen(AppScreen.Welcome)
                    },
                )
                AppScreen.Api -> ApiScreen(
                    config = llmConfig,
                    models = models,
                    onBack = { onScreen(AppScreen.Welcome) },
                    onTest = { vm.testApi() },
                    onRefreshModels = { vm.refreshModels() },
                    onSave = { b, m, k, p -> vm.saveLlmConfig(b, m, k, p) },
                )
                AppScreen.Help -> HelpScreen()
                AppScreen.Game -> when (gameTab) {
                    GameTab.Scene -> SceneScreen(
                        state = state, pack = pack, event = event,
                        onAction = { vm.startEvent(it) },
                        onTalk = { vm.startEvent("talk", "与${it}交谈") },
                        onOption = { vm.chooseOption(it) },
                        onEndEvent = { vm.endEvent() },
                        onFreeText = { vm.startEvent("travel", it) },
                    )
                    GameTab.Map -> MapScreen(state, pack, onMove = { vm.moveTo(it) })
                    GameTab.Profile -> ProfileScreen(state, pack, onBreakthrough = { vm.breakthrough() })
                    GameTab.Bag -> BagScreen(state, pack, onUseItem = { vm.useItem(it) })
                    GameTab.Settings -> SettingsScreen(
                        state = state, pack = pack,
                        onAiStyle = { vm.setAiStyle(it) },
                        onLang = { vm.setLang(it) },
                        onToggleLimit = { vm.toggleLimit() },
                        onToggleBgm = { vm.toggleBgm() },
                        onApi = { onScreen(AppScreen.Api) },
                        onExport = { vm.exportSaves() },
                        onImport = { raw -> vm.importSaves(raw) },
                        onDelete = { showDelete = true },
                    )
                }
            }
        }
    }

    // Toast（悬浮在整窗之上）
    if (feedback != null) {
        LaunchedEffect(feedback.message) {
            delay(2200)
            vm.clearFeedback()
        }
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Surface(
                color = c.ink,
                shape = CircleShape,
                modifier = Modifier.padding(bottom = 100.dp).clip(CircleShape).clickable { vm.clearFeedback() },
            ) {
                Text(
                    feedback.message,
                    color = Color.White,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 11.dp),
                )
            }
        }
    }

    // Breakthrough fullscreen
    if (breakthrough != null) {
        Box(
            Modifier.fillMaxSize().background(c.world.soft),
            contentAlignment = Alignment.Center,
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .padding(24.dp)
                    .windowInsetsPadding(WindowInsets.safeDrawing),
            ) {
                Text(pack.icon, fontSize = 56.sp)
                Text(pack.advance + "成功", fontSize = 34.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.03f).sp)
                Spacer(Modifier.height(12.dp))
                Surface(color = c.world.accent, shape = CircleShape) {
                    Text(
                        breakthrough.substringAfter("·").trim().ifEmpty { breakthrough },
                        color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 22.dp, vertical = 10.dp),
                    )
                }
                Spacer(Modifier.height(12.dp))
                Text("战力提升　寿限增加", color = c.ink2, fontSize = 14.sp)
                Spacer(Modifier.height(28.dp))
                com.lvjie.nativeapp.ui.components.LvjieButton("继续旅程", onClick = { vm.dismissBreakthrough() })
            }
        }
    }

    // 导出 JSON → 系统分享
    val context = androidx.compose.ui.platform.LocalContext.current
    val exportPayload = exportJson
    if (exportPayload != null) {
        LaunchedEffect(exportPayload) {
            val intent = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                type = "application/json"
                putExtra(android.content.Intent.EXTRA_TEXT, exportPayload)
            }
            runCatching {
                context.startActivity(android.content.Intent.createChooser(intent, "分享存档 JSON"))
            }
            vm.clearExportJson()
        }
    }

    if (showDelete) {
        AlertDialog(
            onDismissRequest = { showDelete = false },
            title = { Text("删除本世界存档？") },
            text = { Text("此操作不可恢复。其它世界与 API Key 不受影响。") },
            confirmButton = {
                TextButton(onClick = {
                    showDelete = false
                    vm.deleteCurrentSave {
                        onScreen(AppScreen.Welcome)
                    }
                }) { Text("确认删除", color = c.error) }
            },
            dismissButton = {
                TextButton(onClick = { showDelete = false }) { Text("取消") }
            },
        )
    }
    } // end outer Box
}

@Composable
private fun TopBar(
    screen: AppScreen,
    pack: com.lvjie.nativeapp.data.WorldPack,
    state: com.lvjie.nativeapp.data.PlayerState,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = LocalLvjieColors.current
    val title = when (screen) {
        AppScreen.Welcome -> "旅界"
        AppScreen.Detail -> "世界详情"
        AppScreen.Author -> "自定义世界"
        AppScreen.Api -> "API 与模型"
        AppScreen.Help -> "帮助"
        AppScreen.Game -> "${pack.name} · 旅界"
    }
    val sub = when (screen) {
        AppScreen.Game -> "${state.name} · ${tierLabel(state, pack)}"
        AppScreen.Welcome -> "安卓原生 · ${pack.name}世界"
        else -> null
    }
    Row(
        modifier = modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (screen != AppScreen.Welcome) {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape).clickable(onClick = onBack),
                contentAlignment = Alignment.Center,
            ) { Text("←", fontSize = 18.sp, color = c.ink2) }
            Spacer(Modifier.width(8.dp))
        } else {
            Box(
                modifier = Modifier.size(34.dp).clip(androidx.compose.foundation.shape.RoundedCornerShape(11.dp))
                    .background(Color(0xFFFF5A00)),
                contentAlignment = Alignment.Center,
            ) { Text("旅", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold) }
            Spacer(Modifier.width(10.dp))
        }
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.015f).sp)
            if (sub != null) Text(sub, color = c.ink3, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
        }
        if (screen == AppScreen.Game) {
            Surface(color = c.surface, shape = CircleShape) {
                Text(
                    "${state.money} ${pack.money}",
                    fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = c.ink2,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
    }
}

@Composable
private fun OnboardBar(current: AppScreen, onScreen: (AppScreen) -> Unit) {
    val items = listOf(
        Triple(AppScreen.Welcome, "✦", "世界"),
        Triple(AppScreen.Author, "🛠", "工坊"),
        Triple(AppScreen.Api, "🔑", "API"),
        Triple(AppScreen.Help, "?", "更多"),
    )
    NavigationBar(containerColor = LocalLvjieColors.current.surface.copy(alpha = 0.92f), tonalElevation = 0.dp) {
        items.forEach { (scr, icon, label) ->
            val sel = scr == current
            NavigationBarItem(
                selected = sel,
                onClick = { onScreen(scr) },
                icon = { Text(icon, fontSize = 16.sp) },
                label = { Text(label, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = LocalLvjieColors.current.world.deep,
                    selectedTextColor = LocalLvjieColors.current.world.deep,
                    indicatorColor = LocalLvjieColors.current.world.soft,
                    unselectedIconColor = LocalLvjieColors.current.ink3,
                    unselectedTextColor = LocalLvjieColors.current.ink3,
                ),
            )
        }
    }
}
