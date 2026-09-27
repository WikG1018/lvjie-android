// 世界观注册表：内置包 + 用户自定义包
import { xiuxianPack } from './xiuxian/pack.js'
import { xuanhuanPack } from './xuanhuan/pack.js'
import { wuxiaPack } from './wuxia/pack.js'
import { urbanPack } from './urban/pack.js'
import { apocalypsePack } from './apocalypse/pack.js'
import { westernPack } from './western/pack.js'
import { loadCustomPacks } from '../engine/custom-packs.js'

const BUILTIN_LIST = [
  xiuxianPack,
  xuanhuanPack,
  wuxiaPack,
  urbanPack,
  apocalypsePack,
  westernPack
]

const BUILTIN_IDS = new Set(BUILTIN_LIST.map(p => p.id))

function buildRegistry() {
  const packs = Object.fromEntries(BUILTIN_LIST.map(p => [p.id, p]))
  const order = BUILTIN_LIST.map(p => p.id)
  for (const p of loadCustomPacks()) {
    if (BUILTIN_IDS.has(p.id)) continue
    packs[p.id] = p
    if (!order.includes(p.id)) order.push(p.id)
  }
  return { packs, order }
}

const reg = buildRegistry()
export const PACKS = reg.packs
export let PACK_ORDER = reg.order

// 供 progression 等 O(1) 访问
globalThis.__AW_PACKS__ = PACKS

/** 自定义包变更后刷新注册表 */
export function reloadPacks() {
  const next = buildRegistry()
  for (const k of Object.keys(PACKS)) {
    if (!next.packs[k]) delete PACKS[k]
  }
  Object.assign(PACKS, next.packs)
  PACK_ORDER = next.order
  globalThis.__AW_PACKS__ = PACKS
  return listPacks()
}

export function getPack(id) {
  return PACKS[id] || null
}

export function listPacks() {
  return PACK_ORDER.map(id => PACKS[id]).filter(Boolean)
}

export function defaultPackId() {
  return 'xiuxian'
}

export function isBuiltinPack(id) {
  return BUILTIN_IDS.has(id)
}
