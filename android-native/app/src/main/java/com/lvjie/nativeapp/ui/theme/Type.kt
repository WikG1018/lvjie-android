package com.lvjie.nativeapp.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.R

/**
 * MiSans 字阶 — 与设计规范 A3 一致。
 * 若 res/font/misans_* 未放入，系统回落 PingFang / Noto Sans SC。
 */
val MiSans: FontFamily = FontFamily(
    Font(R.font.misans_regular, FontWeight.Normal),
    Font(R.font.misans_medium, FontWeight.Medium),
    Font(R.font.misans_semibold, FontWeight.SemiBold),
    Font(R.font.misans_bold, FontWeight.Bold),
)

val LvjieTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Bold,
        fontSize = 34.sp, lineHeight = 40.sp, letterSpacing = (-0.025f).sp
    ),
    displayMedium = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Bold,
        fontSize = 28.sp, lineHeight = 34.sp, letterSpacing = (-0.02f).sp
    ),
    headlineMedium = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Bold,
        fontSize = 22.sp, lineHeight = 28.sp, letterSpacing = (-0.015f).sp
    ),
    titleLarge = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Bold,
        fontSize = 18.sp, lineHeight = 24.sp, letterSpacing = (-0.01f).sp
    ),
    titleMedium = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Bold,
        fontSize = 15.sp, lineHeight = 21.sp
    ),
    titleSmall = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp, lineHeight = 18.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Normal,
        fontSize = 15.sp, lineHeight = 26.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Normal,
        fontSize = 13.5.sp, lineHeight = 22.sp
    ),
    bodySmall = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Medium,
        fontSize = 12.sp, lineHeight = 17.sp
    ),
    labelLarge = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp, lineHeight = 18.sp
    ),
    labelMedium = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp, lineHeight = 15.sp, letterSpacing = 0.04f.sp
    ),
    labelSmall = TextStyle(
        fontFamily = MiSans, fontWeight = FontWeight.Medium,
        fontSize = 10.sp, lineHeight = 14.sp, letterSpacing = 0.04f.sp
    ),
)
