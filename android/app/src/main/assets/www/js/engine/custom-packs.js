// 自定义世界包：localStorage 持久化 + 注册表合并
import { validatePackDraft, packToDraft } from './worldpack.js'

export const CUSTOM_PACKS_KEY = 'agentworlds_custom_packs_v1'
export const CUSTOM_PACKS_BACKUP_KEY = 'agentworlds_custom_packs_v1_backup'

export function loadCustomPackDrafts() {
  try {
    const raw = localStorage.getItem(CUSTOM_PACKS_KEY)
    if (!raw) return []
    let arr
    try {
      arr = JSON.parse(raw)
    } catch (e) {
      // 损坏时备份原文，避免下次保存把旧包洗掉
      try { localStorage.setItem(CUSTOM_PACKS_BACKUP_KEY, raw) } catch (e2) { /* ignore */ }
      return []
    }
    return Array.isArray(arr) ? arr.filter(x => x && typeof x === 'object') : []
  } catch (e) { return [] }
}

export function loadCustomPacks() {
  const out = []
  for (const draft of loadCustomPackDrafts()) {
    const v = validatePackDraft(draft)
    if (v.ok && v.pack) out.push(v.pack)
  }
  return out
}

export function hasCustomPack(id) {
  const key = String(id || '').toLowerCase()
  return loadCustomPackDrafts().some(d => String(d.id || '').toLowerCase() === key)
}

export function saveCustomPackDraft(draft, { overwrite = true } = {}) {
  const v = validatePackDraft(draft)
  if (!v.ok) return { ok: false, errors: v.errors }
  const id = v.pack.id
  const list = loadCustomPackDrafts()
  const exists = list.some(d => String(d.id || '').toLowerCase() === id)
  if (exists && !overwrite) {
    return { ok: false, errors: ['已存在同 id 世界包，确认覆盖后再保存'], needConfirm: true }
  }
  const next = list.filter(d => String(d.id || '').toLowerCase() !== id)
  const raw = packToDraft(v.pack)
  next.push(raw)
  try {
    localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(next))
    return { ok: true, pack: v.pack, id, overwritten: exists }
  } catch (e) {
    return { ok: false, errors: [(e && e.message) || '保存失败'] }
  }
}

export function deleteCustomPack(id) {
  const key = String(id || '').toLowerCase()
  const list = loadCustomPackDrafts().filter(d => String(d.id || '').toLowerCase() !== key)
  try {
    localStorage.setItem(CUSTOM_PACKS_KEY, JSON.stringify(list))
    return true
  } catch (e) { return false }
}

export function isCustomPack(id) {
  return hasCustomPack(id)
}
