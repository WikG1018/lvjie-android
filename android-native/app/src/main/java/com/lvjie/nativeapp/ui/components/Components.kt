package com.lvjie.nativeapp.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lvjie.nativeapp.ui.theme.*

@Composable
fun LvjieButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    style: BtnStyle = BtnStyle.Primary,
    enabled: Boolean = true,
    small: Boolean = false,
) {
    val c = LocalLvjieColors.current
    val h = if (small) 32.dp else 44.dp
    val bg = when {
        !enabled -> c.surface3
        style == BtnStyle.Primary -> c.world.accent
        style == BtnStyle.Tonal -> c.world.soft
        style == BtnStyle.Danger -> ErrorSoft
        else -> Color.Transparent
    }
    val fg = when {
        !enabled -> c.ink4
        style == BtnStyle.Primary -> Color.White
        style == BtnStyle.Tonal -> c.world.deep
        style == BtnStyle.Danger -> ErrorRed
        else -> c.ink
    }
    Box(
        modifier = modifier
            .height(h)
            .clip(CircleShape)
            .background(bg)
            .then(
                if (style == BtnStyle.Outline) Modifier.border(1.5.dp, c.lineStrong, CircleShape)
                else if (style == BtnStyle.Ghost) Modifier.border(1.dp, c.line, CircleShape)
                else Modifier
            )
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = if (small) 12.dp else 18.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text,
            color = fg,
            fontSize = if (small) 11.5.sp else 13.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}

enum class BtnStyle { Primary, Tonal, Outline, Ghost, Danger }

@Composable
fun LvjieChip(text: String, selected: Boolean = false, tone: ChipTone = ChipTone.Normal, modifier: Modifier = Modifier) {
    val c = LocalLvjieColors.current
    val (bg, fg) = when {
        tone == ChipTone.Success -> SuccessSoft to Success
        tone == ChipTone.Warning -> WarningSoft to Color(0xFFB07D00)
        tone == ChipTone.Error -> ErrorSoft to ErrorRed
        selected -> c.world.soft to c.world.deep
        else -> c.surface2 to c.ink2
    }
    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(bg)
            .padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Text(text, color = fg, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}

enum class ChipTone { Normal, Success, Warning, Error }

@Composable
fun LvjieCard(
    modifier: Modifier = Modifier,
    hero: Boolean = false,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = LocalLvjieColors.current
    val shape = if (hero) RoundedCornerShape(Radius.Hero) else RoundedCornerShape(Radius.Lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(c.surface)
            .then(
                if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
            )
            .padding(if (hero) 18.dp else 16.dp),
        content = content,
    )
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    val c = LocalLvjieColors.current
    Text(
        text.uppercase(),
        modifier = modifier.padding(horizontal = 2.dp, vertical = 6.dp),
        color = c.ink3,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.12f.sp,
    )
}

@Composable
fun ProgressBar(pct: Float, full: Boolean = false, modifier: Modifier = Modifier) {
    val c = LocalLvjieColors.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(8.dp)
            .clip(CircleShape)
            .background(c.ink.copy(alpha = 0.06f))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(pct.coerceIn(0f, 1f))
                .height(8.dp)
                .clip(CircleShape)
                .background(
                    Brush.horizontalGradient(listOf(c.world.accent, c.world.accent.copy(alpha = 0.55f)))
                )
        )
    }
}

@Composable
fun StatCell(label: String, value: String, modifier: Modifier = Modifier) {
    val c = LocalLvjieColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(Radius.Md))
            .background(c.surface2)
            .border(1.dp, c.line, RoundedCornerShape(Radius.Md))
            .padding(12.dp)
    ) {
        Text(label, color = c.ink3, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.04f.sp)
        Text(value, color = c.ink, fontSize = 20.sp, fontWeight = FontWeight.Bold, letterSpacing = (-0.02f).sp)
    }
}

@Composable
fun ListItem(
    icon: String,
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    trail: @Composable (() -> Unit)? = null,
    onClick: (() -> Unit)? = null,
) {
    val c = LocalLvjieColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(Radius.Md))
            .background(c.surface)
            .border(1.dp, c.line.copy(alpha = 0.7f), RoundedCornerShape(Radius.Md))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(c.world.soft),
            contentAlignment = Alignment.Center,
        ) { Text(icon, fontSize = 18.sp) }
        Column(Modifier.weight(1f)) {
            Text(title, color = c.ink, fontSize = 13.5.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(subtitle, color = c.ink3, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        trail?.invoke()
    }
}

@Composable
fun LvjieSwitch(on: Boolean, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    val c = LocalLvjieColors.current
    Box(
        modifier = modifier
            .size(width = 48.dp, height = 28.dp)
            .clip(CircleShape)
            .background(if (on) c.world.accent else c.ink4)
            .clickable(onClick = onToggle),
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(start = if (on) 22.dp else 3.dp)
                .size(22.dp)
                .clip(CircleShape)
                .background(Color.White)
        )
    }
}

@Composable
fun EmptyState(icon: String, title: String, desc: String, action: (@Composable () -> Unit)? = null) {
    val c = LocalLvjieColors.current
    Column(
        modifier = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(icon, fontSize = 40.sp)
        Spacer(Modifier.height(10.dp))
        Text(title, color = c.ink2, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(4.dp))
        Text(desc, color = c.ink3, fontSize = 12.sp)
        if (action != null) {
            Spacer(Modifier.height(14.dp))
            action()
        }
    }
}
