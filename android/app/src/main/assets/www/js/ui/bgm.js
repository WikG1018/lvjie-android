// 背景音乐：内置 mp3/mid + 用户自定义（IndexedDB）
// 同时最多一个音源；id 为 '' 表示「无音乐」
import { BGM_TRACKS, BGM_DEFAULT } from '../engine/constants.js'
import { MidiPlayer, isMidiFile } from '../engine/midi.js'
import { listCustomBgm, customTracksFrom, blobUrl, removeCustomBgm, putCustomBgm, fileToTrack } from '../engine/custom-bgm.js'

let audioEl = null
const midiPlayer = new MidiPlayer()
let currentId = null
let playSeq = 0
let userTracks = []
let userUrl = null

export function initBgm() {
  if (!audioEl) {
    audioEl = new Audio()
    audioEl.loop = true
    audioEl.preload = 'auto'
    audioEl.volume = 0.35
  }
  if (!initBgm._gesture) {
    initBgm._gesture = true
    const kick = () => {
      try {
        // 仅在明确有曲且当前无声时补播
        if (currentId === '' || currentId == null) return
        const t = trackOf(currentId)
        if (!t || !t.file && !(t.custom && t.blob)) return
        const midi = t.kind === 'midi' || (t.file && isMidiFile(t.file))
        if (midi && !midiPlayer.playing) playBgm(currentId)
        else if (!midi && audioEl && audioEl.paused && audioEl.src) audioEl.play().catch(() => {})
      } catch (e) { /* ignore */ }
    }
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
      document.addEventListener(ev, kick, { once: true, passive: true })
    }
  }
}

export async function hydrateCustomBgm() {
  try {
    const rows = await listCustomBgm()
    userTracks = customTracksFrom(rows)
    return userTracks
  } catch (e) {
    userTracks = []
    return []
  }
}

export function allBgmTracks() {
  return [...BGM_TRACKS, ...userTracks]
}

function trackOf(id) {
  const list = allBgmTracks()
  if (id === '' || id == null) {
    return list.find(t => t.id === '') || { id: '', name: '无音乐', file: '' }
  }
  const hit = list.find(t => t.id === id)
  if (hit) return hit
  const def = list.find(t => t.id === BGM_DEFAULT) || list.find(t => t.id === 'm027') || list.find(t => t.file) || list[0]
  return def || { id: '', name: '无音乐', file: '' }
}

function revokeUserUrl() {
  if (userUrl) {
    try { URL.revokeObjectURL(userUrl) } catch (e) { /* ignore */ }
    userUrl = null
  }
}

function stopAllSources() {
  try { midiPlayer.stop() } catch (e) { /* ignore */ }
  if (audioEl) {
    try {
      audioEl.pause()
      audioEl.currentTime = 0
    } catch (e) { /* ignore */ }
  }
  revokeUserUrl()
}

export function playBgm(id) {
  initBgm()
  // 明确「无音乐」
  if (id === '' || id == null) {
    currentId = ''
    playSeq++
    stopAllSources()
    return
  }
  const t = trackOf(id)
  const seq = ++playSeq

  // 同一曲仍在响则不打断
  const samePlaying = t.id === currentId && (
    (t.kind === 'midi' || (t.file && isMidiFile(t.file)))
      ? midiPlayer.playing
      : (audioEl && !audioEl.paused && !!audioEl.src)
  )
  if (samePlaying) return

  currentId = t.id
  stopAllSources()

  if (t.custom && t.blob) {
    if (t.kind === 'midi') {
      t.blob.arrayBuffer().then(buf => {
        if (seq !== playSeq) return
        midiPlayer.loop = true
        return midiPlayer.playArrayBuffer(buf, t.id)
      }).catch(() => {})
    } else {
      if (seq !== playSeq) return
      userUrl = blobUrl(t.blob)
      audioEl.src = userUrl
      audioEl.play().catch(() => {})
    }
    return
  }

  if (!t.file) {
    // 无文件 = 无音乐
    currentId = ''
    return
  }
  if (isMidiFile(t.file)) {
    midiPlayer.loop = true
    midiPlayer.playUrl(t.file, t.id).then(r => {
      if (seq !== playSeq) {
        midiPlayer.stop()
        return
      }
      if (r && r.ok) midiPlayer.playing = true
    }).catch(() => {})
    return
  }
  if (seq !== playSeq) return
  audioEl.src = t.file
  audioEl.play().catch(() => {})
}

export function stopBgm() {
  playSeq++
  currentId = ''
  stopAllSources()
}

export function currentBgmId() {
  return currentId
}

export async function addLocalBgmFiles(fileList) {
  const files = Array.from(fileList || []).slice(0, 8)
  const added = []
  for (const f of files) {
    if (!/\.(mp3|wav|ogg|m4a|mid|midi)$/i.test(f.name)) continue
    const row = fileToTrack(f)
    try {
      await putCustomBgm(row)
      userTracks = customTracksFrom(await listCustomBgm())
      added.push(row)
    } catch (e) { /* skip */ }
  }
  return added
}

export async function removeLocalBgm(id) {
  await removeCustomBgm(id)
  userTracks = customTracksFrom(await listCustomBgm())
  if (currentId === id) stopBgm()
}

export function showGamePlay(S) {
  try {
    // 存档里显式 '' = 无音乐；undefined/null 用默认
    const raw = S && Object.prototype.hasOwnProperty.call(S, 'bgmTrack') ? S.bgmTrack : null
    playBgm(raw == null ? 'm027' : raw)
  } catch (e) { /* ignore */ }
}
