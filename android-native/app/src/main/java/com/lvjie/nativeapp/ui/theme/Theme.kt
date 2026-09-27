package com.lvjie.nativeapp.ui.theme

import androidx.compose.material3.MaterialTheme
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
    content: @Composable () -> Unit,
) {
    val ext = LvjieColors(world = world)
    val scheme = lightColorScheme(
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
