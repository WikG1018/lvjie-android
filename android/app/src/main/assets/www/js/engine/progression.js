// 等级进度：完全由世界观包驱动
// pack.tiers: [{ name, lifespan?, subNames?|null, ... }]
// pack.subNames: 默认小级名
import { clamp } from './util.js'
import { packUi, packFeatures } from './pack-ui.js'

export function packOf(S) {
  // 延迟由 boot 注入；这里通过全局 registry 取
  const reg = globalThis.__AW_PACKS__
  if (!reg) throw new Error('worldviews not registered')
  return reg[S.worldview] || reg[Object.keys(reg)[0]]
}

export function tiersOf(S) {
  return packOf(S).tiers
}

export function tierCount(S) {
  return tiersOf(S).length
}

export function tierName(S, i) {
  const t = tiersOf(S)[i]
  return t ? t.name : '未知'
}

export function subNamesOf(S, tierIndex) {
  const pack = packOf(S)
  const t = tiersOf(S)[tierIndex]
  if (t && Array.isArray(t.subNames) && t.subNames.length) return t.subNames
  return pack.subNames || ['初', '中', '高']
}

export function subCount(S, tierIndex) {
  return subNamesOf(S, tierIndex).length
}

export function tierLabel(S) {
  const names = subNamesOf(S, S.tierIndex)
  const sn = names[clamp(S.sub, 0, names.length - 1)] || ''
  return tierName(S, S.tierIndex) + sn
}

export function tierIndexOfStr(S, str) {
  const tiers = tiersOf(S)
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (String(str).includes(tiers[i].name)) return i
  }
  return null
}

export function lifespanOf(S, i) {
  const t = tiersOf(S)[i]
  if (!t) return 100
  if (t.lifespan === Infinity) return Infinity
  return t.lifespan != null ? t.lifespan : 100
}

export function isLifeExpired(S) {
  const pack = packOf(S)
  if (packFeatures(pack).lifespan === false) return false
  return S.ageDays / 360 > lifespanOf(S, S.tierIndex)
}

/** 境界/等级基准数：第0级=1，每高一级 ×10（可被 pack.powerMode 覆盖） */
export function tierBase(S, i) {
  const pack = packOf(S)
  if (pack.tierBase) return pack.tierBase(i)
  return i <= 0 ? 1 : 10 * Math.pow(10, i - 1)
}

export function subPowerList(S) {
  const pack = packOf(S)
  if (pack.subPower) return pack.subPower
  return [1, 1.25, 1.6, 1.8]
}

export function cultReq(S, i, s) {
  const pack = packOf(S)
  if (pack.cultReq) return pack.cultReq(i, s)
  const n = subCount(S, i)
  const steps = i === 0 ? [1, 2, 4] : [1, 2, 4, 4]
  const idx = clamp(s, 0, Math.max(0, n - 1))
  return tierBase(S, i) * (steps[idx] != null ? steps[idx] : 4)
}

export function playerCultReq(S) {
  const pack = packOf(S)
  let r = cultReq(S, S.tierIndex, S.sub)
  if (pack.talentCultMul && S.talent) {
    const m = pack.talentCultMul(S.talent)
    if (typeof m === 'number') r *= m
  }
  return r
}

/** 年修为增长（包可覆盖） */
export function yearlyCult(S, i) {
  const pack = packOf(S)
  if (pack.yearlyCult) return pack.yearlyCult(i)
  const total = (i === 0 ? 7.2 : 11) * tierBase(S, i)
  const years = pack.cultYears ? pack.cultYears[i] : (i === 0 ? 2 : 20 * Math.pow(4, i - 1))
  return total / Math.max(1, years)
}

export function speedMult(S, i) {
  const pack = packOf(S)
  if (pack.speedMult) return pack.speedMult(i)
  return Math.pow(2, Math.max(0, i) - 1)
}

export function basePower(S, i, s) {
  const pack = packOf(S)
  if (pack.basePower) return pack.basePower(i, s)
  const subs = subPowerList(S)
  return tierBase(S, i) * (subs[clamp(s, 0, subs.length - 1)] || 1)
}

export function tierColor(S, i) {
  const pack = packOf(S)
  if (pack.tierColor) return pack.tierColor(i)
  const n = tierCount(S)
  const r = n > 1 ? i / (n - 1) : 0
  if (r <= 0.33) return 'var(--jade)'
  if (r <= 0.66) return 'var(--blue)'
  return 'var(--gold)'
}

/** 尝试升级（突破/晋升/跃迁…）：返回 {ok, msg, broke} */
export function tryBreakthrough(S) {
  const pack = packOf(S)
  const ui = packUi(pack)
  const prog = (pack.lexicon && pack.lexicon.progress) || '进度'
  const req = playerCultReq(S)
  if (S.progress < req) {
    return { ok: false, msg: ui.advanceFail || (`当前${prog}不足，无法${ui.advanceVerb}`) }
  }
  const maxTier = tierCount(S) - 1
  const names = subNamesOf(S, S.tierIndex)
  S.progress -= req
  if (S.sub < names.length - 1) {
    S.sub += 1
    return { ok: true, broke: false, msg: `${ui.advanceTo} ${tierLabel(S)}` }
  }
  if (S.tierIndex < maxTier) {
    S.tierIndex += 1
    S.sub = 0
    return { ok: true, broke: true, msg: `${ui.advanceTo} ${tierLabel(S)}！` }
  }
  S.progress = 0
  return { ok: true, broke: true, msg: `${ui.advancePeak}（${tierLabel(S)}）` }
}
