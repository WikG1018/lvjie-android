// 地图：旅行、解锁、AI 扩图
import { packOf, speedMult } from './progression.js'

export function curLoc(S) {
  return (S && S.map && S.map.find(l => l.id === S.currentLoc)) || (S && S.map && S.map[0]) || null
}

export function genLocId(S) {
  S._locSeq = (S._locSeq || 0) + 1
  return 'ai_loc_' + S._locSeq
}

/** 包定义的通行门槛：pack.gateRules(c, t) => null | 字符串原因 */
export function gateReason(S, from, to) {
  const pack = packOf(S)
  if (pack.gateRules) {
    const r = pack.gateRules(from, to, S)
    if (r) return r
  }
  return null
}

/**
 * 旅行：直接同步返回 {ok, days, msg}（事件叙事由 AI 层负责）
 * 简化版：旅行立即到达，天数记入 ageDays；由调用方决定是否走 AI。
 */
export function travel(S, targetName) {
  const c = curLoc(S)
  const t = S.map.find(l => l.name === targetName)
  if (!t) return { ok: false, msg: '没有这个地方' }
  if (c && c.id === t.id) return { ok: false, msg: '你已在此处' }
  const gate = gateReason(S, c || {}, t)
  if (gate) return { ok: false, msg: gate }

  const days = travelDays(S, c || {}, t)
  S.currentLoc = t.id
  S.ageDays += days
  return { ok: true, days, msg: `前往 ${t.name}（${days} 天）` }
}

export function travelDays(S, c, t) {
  const pack = packOf(S)
  if (pack.travelDays) return pack.travelDays(S, c, t)
  const speed = speedMult(S, S.tierIndex)
  let raw = 5
  if (c.world && t.world && c.world !== t.world) {
    raw = pack.crossWorldDays ? pack.crossWorldDays(c.world, t.world) : 320
  } else if (c.continent && t.continent && c.continent !== t.continent) {
    raw = 20
  } else {
    raw = 5
  }
  return Math.max(0, Math.floor(raw / speed))
}

/** AI 新增地点落库 */
export function applyNewLocations(S, arr) {
  if (!Array.isArray(arr)) return 0
  const pack = packOf(S)
  let n = 0
  for (const raw of arr.slice(0, 6)) {
    if (!raw || !raw.name) continue
    if (S.map.some(l => l.name === raw.name)) continue
    if (S.map.length >= 80) break
    const cur = curLoc(S) || {}
    const world = normalizeWorld(pack, raw.world, cur.world)
    const continent = String(raw.continent || cur.continent || '未知地域')
    const loc = {
      id: genLocId(S),
      name: String(raw.name),
      world,
      continent,
      type: String(raw.type || '荒野'),
      desc: String(raw.desc || ''),
      people: Array.isArray(raw.people) ? raw.people.map(normPerson) : [],
      shop: Array.isArray(raw.shop) ? raw.shop.map(x => normShop(S, pack, x)) : [],
      beasts: Array.isArray(raw.beasts) ? raw.beasts.map(normBeast) : [],
      interactables: Array.isArray(raw.interactables) ? raw.interactables.map(x => ({
        name: String(x.name || '未知'),
        intro: String(x.intro || '')
      })) : [],
      notes: []
    }
    // 物品境界上限
    if (Array.isArray(loc.shop)) {
      for (const it of loc.shop) clampItemTier(S, pack, loc, it)
    }
    S.map.push(loc)
    n++
  }
  return n
}

function normalizeWorld(pack, w, fallback) {
  const worlds = pack.worlds || []
  if (w && worlds.includes(String(w))) return String(w)
  return fallback || (worlds[0] || '主世界')
}

function normPerson(p) {
  const power = Math.abs(Number(p.power) || 0)
  return {
    name: String(p.name || '无名氏'),
    realm: String(p.realm || ''),
    power: Math.min(1e7, power),
    intro: String(p.intro || ''),
    gender: p.gender === '女' ? '女' : p.gender === '男' ? '男' : (p.gender || ''),
    relations: Array.isArray(p.relations) ? p.relations.filter(r => r && typeof r === 'object' && r.to).slice(0, 12) : [],
    grudges: Array.isArray(p.grudges) ? p.grudges.filter(g => g && typeof g === 'object').slice(0, 8) : []
  }
}

function normShop(S, pack, x) {
  return {
    name: String(x.name || '未知商品'),
    desc: String(x.desc || ''),
    type: x.type || 'special',
    realm_index: x.realm_index != null ? Number(x.realm_index) : undefined,
    grade: x.grade != null ? String(x.grade) : undefined,
    price: Math.max(0, Math.round(Number(x.price) || 0)),
    usable: x.usable,
    use_effect: x.use_effect || undefined,
    levels: x.levels,
    level_costs: x.level_costs,
    level_powers: x.level_powers
  }
}

function normBeast(b) {
  return {
    name: String(b.name || '未知生物'),
    realm: String(b.realm || ''),
    power: Number(b.power) || 0,
    drops: String(b.drops || '')
  }
}

export function worldMaxTier(S, pack, world) {
  if (pack.worldMaxTier && pack.worldMaxTier[world] != null) return pack.worldMaxTier[world]
  return pack.tiers.length - 1
}

function clampItemTier(S, pack, loc, it) {
  if (it.realm_index == null) return
  const max = worldMaxTier(S, pack, loc.world)
  const min = 0
  it.realm_index = Math.max(min, Math.min(max, Math.round(it.realm_index)))
}

export function applyModifyLocations(S, arr) {
  if (!Array.isArray(arr)) return
  for (const raw of arr.slice(0, 10)) {
    if (!raw || !raw.name) continue
    const loc = S.map.find(l => l.name === raw.name)
    if (!loc) continue
    if (raw.change) {
      loc.notes = loc.notes || []
      loc.notes.push(String(raw.change).slice(0, 200))
      if (loc.notes.length > 30) loc.notes = loc.notes.slice(-30)
      loc.desc = (loc.desc ? loc.desc + ' ' : '') + String(raw.change).slice(0, 200)
      if (loc.desc.length > 2000) loc.desc = loc.desc.slice(-2000)
    }
    if (Array.isArray(raw.people)) {
      for (const p of raw.people.slice(0, 10)) {
        if (!p || !p.name) continue
        const ex = loc.people.find(x => x.name === p.name)
        if (ex) Object.assign(ex, normPerson(p))
        else loc.people.push(normPerson(p))
      }
    }
    if (Array.isArray(raw.shop)) {
      for (const s of raw.shop.slice(0, 10)) {
        if (!s || !s.name) continue
        const it = normShop(S, packOf(S), s)
        clampItemTier(S, packOf(S), loc, it)
        const ex = loc.shop.find(x => x.name === s.name)
        if (ex) Object.assign(ex, it)
        else loc.shop.push(it)
      }
    }
  }
}

export function applyRemoveLocations(S, names, pack) {
  if (!Array.isArray(names) || !S.map) return
  const startLoc = pack && pack.startLoc
  for (const n of names.slice(0, 10)) {
    const loc = S.map.find(l => l.name === n)
    if (!loc) continue
    if (loc.id === S.currentLoc) continue
    if (startLoc && loc.id === startLoc) continue
    if (S.map.length <= 1) continue
    S.map = S.map.filter(l => l.id !== loc.id)
  }
  if (!S.map.some(l => l.id === S.currentLoc) && S.map[0]) S.currentLoc = S.map[0].id
}

export function moveByName(S, name) {
  const t = S.map.find(l => l.name === name)
  if (t) S.currentLoc = t.id
}

export function mapSummary(S) {
  return S.map.map(l => ({
    name: l.name,
    world: l.world,
    continent: l.continent,
    type: l.type
  }))
}
