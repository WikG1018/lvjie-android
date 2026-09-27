package com.lvjie.nativeapp.ui.theme

import androidx.compose.ui.graphics.Color

// ===== 中性骨架（HyperOS） =====
val Canvas = Color(0xFFEFF0F4)
val Surface = Color(0xFFFFFFFF)
val Surface2 = Color(0xFFF7F8FA)
val Surface3 = Color(0xFFEEF0F5)
val Ink = Color(0xFF17181C)
val Ink2 = Color(0xFF5B5E68)
val Ink3 = Color(0xFF9CA0AB)
val Ink4 = Color(0xFFC2C6D0)
val Line = Color(0xFFE6E8EE)
val LineStrong = Color(0xFFD5D9E2)

// ===== 品牌 =====
val Accent = Color(0xFFFF6A00)
val AccentSoft = Color(0xFFFFF1E6)
val AccentInk = Color(0xFFC24E00)

// ===== 功能语义 =====
val Success = Color(0xFF00A870)
val SuccessSoft = Color(0xFFE2F6EE)
val Warning = Color(0xFFE6A100)
val WarningSoft = Color(0xFFFFF4D9)
val ErrorRed = Color(0xFFE5484D)
val ErrorSoft = Color(0xFFFDEBEC)
val Blue = Color(0xFF2E6BE6)
val BlueSoft = Color(0xFFE6EEFF)
val Purple = Color(0xFF7C5CFF)
val PurpleSoft = Color(0xFFEEE9FF)

/** 世界观主题色（accent / soft / deep） */
data class WorldColors(
    val accent: Color,
    val soft: Color,
    val deep: Color,
    val glow: Color = accent.copy(alpha = 0.28f),
)

object WorldPalettes {
    val Xiuxian = WorldColors(Color(0xFFC9A227), Color(0xFFFBF3DC), Color(0xFF8A6B12))
    val Xuanhuan = WorldColors(Color(0xFF7C5CFF), Color(0xFFEEE9FF), Color(0xFF4B2FCC))
    val Wuxia = WorldColors(Color(0xFFC24B2E), Color(0xFFFBE8E2), Color(0xFF8E2F1A))
    val Urban = WorldColors(Color(0xFF2E6BE6), Color(0xFFE6EEFF), Color(0xFF1A46A0))
    val Apocalypse = WorldColors(Color(0xFF3D8B5A), Color(0xFFE4F3EA), Color(0xFF256B3F))
    val Western = WorldColors(Color(0xFFB84A9A), Color(0xFFF8E6F2), Color(0xFF7E2E67))

    fun byId(id: String): WorldColors = when (id) {
        "xuanhuan" -> Xuanhuan
        "wuxia" -> Wuxia
        "urban" -> Urban
        "apocalypse" -> Apocalypse
        "western" -> Western
        else -> Xiuxian
    }
}
