// 本地自定义 BGM：IndexedDB 存文件 blob，跨会话可用
const DB_NAME = 'agentworlds_bgm'
const STORE = 'tracks'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const out = fn(store)
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out)
    t.onerror = () => reject(t.error)
  })
}

export async function listCustomBgm() {
  try {
    const rows = await tx('readonly', s => s.getAll())
    return Array.isArray(rows) ? rows : []
  } catch (e) {
    return []
  }
}

export async function putCustomBgm({ id, name, kind, blob }) {
  const row = {
    id: String(id),
    name: String(name || id),
    kind: kind === 'midi' ? 'midi' : 'audio',
    blob,
    at: Date.now()
  }
  await tx('readwrite', s => s.put(row))
  return row
}

export async function removeCustomBgm(id) {
  await tx('readwrite', s => s.delete(String(id)))
}

export function isMidiName(name) {
  return /\.(mid|midi)$/i.test(String(name || ''))
}

export function fileToTrack(file) {
  const id = 'user_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e4)
  const name = String(file.name || '自定义音乐').replace(/\.[^.]+$/, '').slice(0, 24) || '自定义音乐'
  return {
    id,
    name,
    kind: isMidiName(file.name) ? 'midi' : 'audio',
    blob: file
  }
}

/** 生成播放用 blob URL（调用方负责 revoke） */
export function blobUrl(blob) {
  return URL.createObjectURL(blob)
}

/** 启动时灌入运行时 track 列表 */
export function customTracksFrom(rows) {
  return (rows || []).map(r => ({
    id: r.id,
    name: r.name + (r.kind === 'midi' ? ' ♪' : ''),
    file: '', // 运行时由 playCustom 解析
    custom: true,
    kind: r.kind,
    blob: r.blob
  }))
}
