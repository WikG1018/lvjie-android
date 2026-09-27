// 装备穿戴（equip 型物品）
import { normalizeType } from './inventory.js'

function keyOf(it) {
  return [it && it.name, normalizeType(it && it.type), it && it.grade || '', it && it.realm_index == null ? '' : it.realm_index].join('|')
}

export function ensureEquipFlags(S) {
  if (!S || !Array.isArray(S.inventory)) return
  for (const it of S.inventory) {
    if (it && it.equipped == null) it.equipped = false
  }
}

export function equippedItems(S) {
  ensureEquipFlags(S)
  return (S.inventory || []).filter(x => x && normalizeType(x.type) === 'equip' && x.equipped)
}

export function isEquipped(S, it) {
  return !!(it && it.equipped)
}

/** 同名同档只装一件；返回 {ok, msg} */
export function toggleEquip(S, it) {
  if (!S || !it) return { ok: false, msg: '无法装备' }
  if (normalizeType(it.type) !== 'equip') return { ok: false, msg: '该物品不可装备' }
  ensureEquipFlags(S)
  if (it.equipped) {
    it.equipped = false
    return { ok: true, msg: `已卸下 ${it.name}` }
  }
  // 同一装备槽（按 name 简化）只保留一件
  const k = keyOf(it)
  for (const x of S.inventory) {
    if (x && x.equipped && keyOf(x) === k) {
      // 重复，无需再装
      return { ok: true, msg: `已装备 ${it.name}` }
    }
  }
  it.equipped = true
  return { ok: true, msg: `已装备 ${it.name}` }
}

export function equipSummary(S) {
  return equippedItems(S).map(it => ({
    name: it.name,
    grade: it.grade || '',
    realm_index: it.realm_index,
    desc: it.desc || '',
    power: Number(it.power) || 0
  }))
}
