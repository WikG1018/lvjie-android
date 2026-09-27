package com.lvjie.nativeapp.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/** 形状系统 — 与设计规范 A4 一致：28 / 22 / 16 / 12 / pill */
val LvjieShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

object Radius {
    val Hero = 28.dp
    val Lg = 22.dp
    val Md = 16.dp
    val Sm = 12.dp
    val Xs = 8.dp
    val Pill = 999.dp
}
