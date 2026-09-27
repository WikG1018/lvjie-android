package com.lvjie.nativeapp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

data class LvjieColors(
    val canvas: Color = Canvas,
    val surface: Color = Surface,
    val surface2: Color = Surface2,
    val surface3: Color = Surface3,
    val ink: Color = Ink,
    val ink2: Color = Ink2,
    val ink3: Color = Ink3,
    val ink4: Color = Ink4,
    val line: Color = Line,
    val lineStrong: Color = LineStrong,
    val accent: Color = Accent,
    val accentSoft: Color = AccentSoft,
    val accentInk: Color = AccentInk,
    val success: Color = Success,
    val warning: Color = Warning,
    val error: Color = ErrorRed,
    val blue: Color = Blue,
    val world: WorldColors = WorldPalettes.Xiuxian,
)

val LocalLvjieColors = staticCompositionLocalOf { LvjieColors() }

@Composable
fun LvjieTheme(
    world: WorldColors = WorldPalettes.Xiuxian,
    dark: Boolean = androidx.compose.foundation.isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val ext = if (dark) LvjieColors(
        canvas = Color(0xFF121318),
        surface = Color(0xFF1C1D23),
        surface2 = Color(0xFF24262E),
        surface3 = Color(0xFF2C2E37),
        ink = Color(0xFFF2F3F7),
        ink2 = Color(0xFFB7BBC6),
        ink3 = Color(0xFF8A8F9B),
        ink4 = Color(0xFF5B6070),
        line = Color(0xFF2E313A),
        lineStrong = Color(0xFF3A3E4A),
        accent = Accent,
        accentSoft = Color(0xFF3A2818),
        accentInk = Color(0xFFFFB07A),
        world = world,
    ) else LvjieColors(world = world)
    val scheme = if (dark) darkColorScheme(
        primary = world.accent,
        onPrimary = Color.White,
        primaryContainer = world.deep,
        onPrimaryContainer = world.soft,
        secondary = Accent,
        onSecondary = Color.White,
        background = Color(0xFF121318),
        onBackground = Color(0xFFF2F3F7),
        surface = Color(0xFF1C1D23),
        onSurface = Color(0xFFF2F3F7),
        surfaceVariant = Color(0xFF24262E),
        onSurfaceVariant = Color(0xFFB7BBC6),
        outline = Color(0xFF2E313A),
        error = ErrorRed,
        onError = Color.White,
        errorContainer = Color(0xFF4A2022),
        onErrorContainer = Color(0xFFFFB3B5),
    ) else lightColorScheme(
        primary = world.accent,
        onPrimary = Color.White,
        primaryContainer = world.soft,
        onPrimaryContainer = world.deep,
        secondary = Accent,
        onSecondary = Color.White,
        secondaryContainer = AccentSoft,
        onSecondaryContainer = AccentInk,
        background = Canvas,
        onBackground = Ink,
        surface = Surface,
        onSurface = Ink,
        surfaceVariant = Surface2,
        onSurfaceVariant = Ink2,
        outline = Line,
        outlineVariant = LineStrong,
        error = ErrorRed,
        onError = Color.White,
        errorContainer = ErrorSoft,
        onErrorContainer = ErrorRed,
    )
    CompositionLocalProvider(LocalLvjieColors provides ext) {
        MaterialTheme(
            colorScheme = scheme,
            typography = LvjieTypography,
            shapes = LvjieShapes,
            content = content,
        )
    }
}
