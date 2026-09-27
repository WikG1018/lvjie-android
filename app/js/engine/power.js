// 战力与相关公式
import { isLifeExpired, basePower, tierBase, cultReq, yearlyCult, packOf, subCount, tierIndexOfStr } from './progression.js'
import { packFeatures } from './pack-ui.js'
import { fmtNum } from './util.js'

const ART_SUM_DECAY = 0.6

export function artPowerF(S, it) {
  const pack = packOf(S)
  const gradeMul = (pack.artPower && pack.artPower[it.grade]) || 0.1
  const ri = it.realm_index == null ? S.tierIndex : it.realm_index
  const raw = gradeMul * tierBase(S, ri)
  // 已装备至少 +1，无品级也给保底
  return Math.max(1, Math.round(raw * 10) / 10)
}

export function techniquePowerF(mm) {
  let s = 0
  const n = Math.min(mm.level || 0, (mm.level_powers || []).length)
  for (let i = 0; i < n; i++) s += Number(mm.level_powers[i]) || 0
  return Math.round(s * 100) / 100
}

export function totalTechniquePower(S) {
  if (!Array.isArray(S.techniques)) return 0
  const min = S.tierIndex - 3
  return S.techniques
    .filter(m => (m.realm_index || 0) >= min)
    .reduce((a, m) => a + techniquePowerF(m), 0)
}

export function friendPowerF(S, f) {
  if (f && f.power && f.power > 0) return f.power
  const rankStr = f ? (f.realm || f.rank) : ''
  const ri = f ? tierIndexOfStr(S, rankStr) : null
  if (ri == null) return 0
  let si = 0
  const pack = packOf(S)
  const sn = pack.subNames || ['初', '中', '高']
  sn.forEach((n, i) => { if (String(rankStr).includes(n)) si = i })
  return basePower(S, ri, si)
}

export function spousePowerF(S) {
  const pack = packOf(S)
  if (packFeatures(pack).marriage === false) return 0
  let p = 0
  ;(S.friends || []).forEach(f => {
    if (!f.married) return
    p += friendPowerF(S, f)
  })
  return Math.round(p * 10) / 10
}

export function totalPowerF(S) {
  let p = basePower(S, S.tierIndex, S.sub) + totalTechniquePower(S) + spousePowerF(S)
  const arts = S.inventory
    .filter(x => x.type === 'equip' && x.equipped)
    .map(a => ({ a, p: artPowerF(S, a) }))
    .sort((x, y) => y.p - x.p)
  let mult = 1
  for (const o of arts) {
    p += o.p * mult
    mult *= ART_SUM_DECAY
  }
  if (packOf(S).features && packFeatures(packOf(S)).lifespan === false) {
    // 无寿限世界不做减半
  } else if (isLifeExpired(S)) p *= 0.5
  return Math.round(p)
}

export function powerBreakdown(S) {
  const base = basePower(S, S.tierIndex, S.sub)
  let art = 0
  const arts = S.inventory
    .filter(x => x.type === 'equip' && x.equipped)
    .map(a => ({ a, p: artPowerF(S, a) }))
    .sort((x, y) => y.p - x.p)
  let mult = 1
  for (const o of arts) {
    art += o.p * mult
    mult *= ART_SUM_DECAY
  }
  const manual = totalTechniquePower(S)
  const spouse = spousePowerF(S)
  const feat = packFeatures(packOf(S))
  const halved = feat.lifespan !== false && isLifeExpired(S)
  const half = halved ? 0.5 : 1
  return {
    base: Math.round(base * half),
    art: Math.round(art * half),
    manual: Math.round(manual * half),
    spouse: Math.round(spouse * half),
    total: Math.round((base + art + manual + spouse) * half),
    halved
  }
}

/** 消耗品效果：增加进度（按自身等级 pct%，高等级吃低等级衰减） */
export function consumableEffect(S, it) {
  const pack = packOf(S)
  const pct = (pack.pillPct && pack.pillPct[it.grade]) || 5
  if (!pct) return 0
  let eff = tierBase(S, it.realm_index || 0) * pct / 100
  const gap = S.tierIndex - (it.realm_index || 0)
  if (gap > 0) eff *= Math.pow(0.25, gap)
  return Math.round(eff * 10) / 10
}

export function consumablePrice(S, ri, grade) {
  const pack = packOf(S)
  const k = pack.pillPriceK != null ? pack.pillPriceK : 20
  const bt = pack.breakthroughGrade
  if (bt && grade === bt) {
    const saved = ri <= 0 ? cultReq(S, 0, subCount(S, 0) - 1) : cultReq(S, ri, subCount(S, ri) - 1)
    return Math.round(saved * (pack.breakthroughPriceK || 25))
  }
  const pct = (pack.pillPct && pack.pillPct[grade]) || 5
  const eff = tierBase(S, ri) * pct / 100
  return Math.round(eff * k)
}

export function equipPrice(S, ri, grade) {
  const pack = packOf(S)
  const k = pack.artPriceK != null ? pack.artPriceK : 100
  const mul = (pack.artPower && pack.artPower[grade]) || 0.1
  return Math.round(mul * tierBase(S, ri) * k)
}

export function yearlySalary(S, i) {
  const pack = packOf(S)
  if (pack.yearlySalary) return pack.yearlySalary(S, i)
  const k = pack.pillPriceK != null ? pack.pillPriceK : 20
  return Math.max(1, Math.round(yearlyCult(S, i) * k / 2))
}
