// 主题令牌：每个世界观一套完整视觉
// body.className 会挂 theme-<id>，并注入下列 CSS 变量

export const DEFAULT_TOKENS = {
  accent: '#e8c46a',
  accent2: '#b98a2f',
  accentDim: '#8a6d2a',
  glow: 'rgba(232,196,106,.35)',
  bg: '#0a0f1e',
  bg2: '#101a33',
  bg3: '#0b1328',
  panel: 'rgba(20,30,56,.78)',
  panel2: 'rgba(26,40,74,.6)',
  line: 'rgba(140,160,220,.16)',
  line2: 'rgba(140,160,220,.3)',
  text: '#d9e1f4',
  dim: '#8b98b8',
  faint: '#5c6a8a',
  jade: '#6fd6b0',
  blue: '#7ab8f5',
  red: '#e06c6c',
  purple: '#c39af5',
  fontDisplay: '"STKaiti","KaiTi","Noto Serif SC",serif',
  fontBody: '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
  fontEvent: '"STKaiti","KaiTi","Noto Serif SC",serif',
  radius: '12px',
  // 背景装饰：body 的 background 第一层（可空）
  deco: '',
  // 欢迎页卡片渐变
  cardBg: 'rgba(20,30,56,.72)'
}

/** 合并各包 theme 到完整令牌 */
export function tokensOf(pack) {
  return Object.assign({}, DEFAULT_TOKENS, (pack && pack.theme) || {})
}

/** 应用到 document：变量 + body class + 背景 */
export function applyThemeTokens(pack) {
  const t = tokensOf(pack)
  const root = document.documentElement
  const map = {
    '--accent': t.accent,
    '--accent2': t.accent2,
    '--accent-dim': t.accentDim,
    '--glow': t.glow,
    '--bg': t.bg,
    '--bg2': t.bg2,
    '--bg3': t.bg3,
    '--panel': t.panel,
    '--panel2': t.panel2,
    '--line': t.line,
    '--line2': t.line2,
    '--text': t.text,
    '--dim': t.dim,
    '--faint': t.faint,
    '--jade': t.jade,
    '--blue': t.blue,
    '--red': t.red,
    '--purple': t.purple,
    '--font-display': t.fontDisplay,
    '--font-body': t.fontBody,
    '--font-event': t.fontEvent,
    '--radius': t.radius,
    '--card-bg': t.cardBg
  }
  for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v)

  document.body.classList.forEach(cls => {
    if (cls.startsWith('theme-')) document.body.classList.remove(cls)
  })
  if (pack) document.body.classList.add('theme-' + pack.id)

  // body 背景：变量 + 可选 deco
  const base = `linear-gradient(165deg, ${t.bg} 0%, ${t.bg2} 52%, ${t.bg3} 100%)`
  const stars = `radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.28), transparent 100%),
    radial-gradient(1px 1px at 34% 62%, rgba(255,255,255,.2), transparent 100%),
    radial-gradient(1px 1px at 55% 30%, rgba(255,255,255,.24), transparent 100%),
    radial-gradient(1px 1px at 72% 74%, rgba(255,255,255,.18), transparent 100%),
    radial-gradient(1px 1px at 88% 12%, rgba(255,255,255,.24), transparent 100%)`
  document.body.style.background = [stars, t.deco, base].filter(Boolean).join(', ')
  document.body.style.backgroundSize = t.decoSize
    ? (t.decoSize + ', auto, auto')
    : 'auto, auto, auto'
  document.body.style.backgroundAttachment = 'fixed'
}
