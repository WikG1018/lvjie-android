package com.lvjie.nativeapp.ui.nav

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.ui.unit.dp
import com.lvjie.nativeapp.ui.theme.LocalLvjieColors

enum class GameTab(val label: String, val icon: String) {
    Scene("场景", "📍"),
    Map("地图", "🗺"),
    Profile("人物", "👤"),
    Bag("囊务", "🎒"),
    Settings("我的", "⚙"),
}

@Composable
fun GameBottomBar(current: GameTab, onSelect: (GameTab) -> Unit, strings: com.lvjie.nativeapp.i18n.UiStrings = com.lvjie.nativeapp.i18n.I18n.of("简体中文")) {
    val c = LocalLvjieColors.current
    NavigationBar(
        containerColor = c.surface.copy(alpha = 0.92f),
        tonalElevation = 0.dp,
    ) {
        GameTab.entries.forEach { tab ->
            val selected = tab == current
            val label = when (tab) {
                GameTab.Scene -> strings.scene
                GameTab.Map -> strings.map
                GameTab.Profile -> strings.profile
                GameTab.Bag -> strings.bag
                GameTab.Settings -> strings.me
            }
            NavigationBarItem(
                selected = selected,
                onClick = { onSelect(tab) },
                icon = { Text(tab.icon, fontSize = 18.sp) },
                label = { Text(label, fontSize = 10.sp, fontWeight = FontWeight.SemiBold) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = c.world.deep,
                    selectedTextColor = c.world.deep,
                    indicatorColor = c.world.soft,
                    unselectedIconColor = c.ink3,
                    unselectedTextColor = c.ink3,
                ),
            )
        }
    }
}
