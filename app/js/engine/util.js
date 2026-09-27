// 通用工具
export function esc(x) {
  return String(x == null ? '' : x)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** 仅放行安全 CSS 颜色，防 style 属性注入 */
export function cssColor(v) {
  const s = String(v == null ? '' : v).trim()
  if (!s) return 'transparent'
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)) return s
  if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/i.test(s)) return s
  if (/^hsla?\(\s*[\d.]+\s*(deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/i.test(s)) return s
  if (/^(transparent|currentColor|inherit|initial|unset)$/i.test(s)) return s
  return 'transparent'
}

export function inVal(id) {
  const el = document.getElementById(id)
  return el ? el.value : ''
}

export function fmtNum(n) {
  if (n === Infinity) return '∞'
  if (n == null || isNaN(n)) n = 0
  n = Math.round(n * 10) / 10
  const neg = n < 0
  n = Math.abs(n)
  let s
  if (n >= 1e8) s = (n / 1e8) + '亿'
  else if (n >= 1e4) s = (n / 1e4) + '万'
  else s = String(n)
  return (neg ? '-' : '') + s
}

export function ageLabel(days) {
  days = Math.max(0, Math.floor(days))
  const y = Math.floor(days / 360)
  const m = Math.floor((days % 360) / 30)
  const d = days % 30
  return y + '岁' + m + '月' + d + '天'
}

export function ageLabelShort(days) {
  return ageLabel(days)
    .replace(/0月0天$/, '')
    .replace(/0天$/, '')
    .replace(/0月$/, '')
}

export function safeParseJSON(s) {
  try { return JSON.parse(s) } catch (e) { /* fallthrough */ }
  try { return JSON.parse(s.replace(/,\s*([}\]])/g, '$1')) } catch (e) { return null }
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

export function pick(arr, i) {
  return arr[((i % arr.length) + arr.length) % arr.length]
}
