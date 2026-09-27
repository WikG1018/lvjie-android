// 轻量 Standard MIDI File 解析 + Web Audio 播放
// 播放：OfflineAudioContext 一次性渲染成 AudioBuffer，再单源播放（避免实时千音符卡顿）

export function parseMidi(buf) {
  const d = buf instanceof DataView ? buf : new DataView(buf.buffer ? buf.buffer : buf)
  let pos = 0
  const u8 = (n) => {
    let v = 0
    for (let i = 0; i < n; i++) v = (v << 8) | d.getUint8(pos++)
    return v
  }
  const tag = () => String.fromCharCode(u8(1), u8(1), u8(1), u8(1))

  if (tag() !== 'MThd') throw new Error('不是 MIDI 文件')
  const hdrLen = u8(4)
  const format = u8(2)
  const ntrks = u8(2)
  const division = u8(2)
  if (hdrLen > 6) pos += hdrLen - 6
  if (division & 0x8000) throw new Error('暂不支持 SMPTE 时基')

  const ticksPerBeat = division || 480
  const rawNotes = []
  let tempoUs = 500000

  for (let t = 0; t < ntrks && pos < d.byteLength; t++) {
    if (tag() !== 'MTrk') break
    const len = u8(4)
    const end = pos + len
    let tick = 0
    let running = 0
    const onMap = new Map()

    const readVLQ = () => {
      let v = 0
      for (;;) {
        const b = d.getUint8(pos++)
        v = (v << 7) | (b & 0x7f)
        if ((b & 0x80) === 0) break
      }
      return v
    }

    while (pos < end) {
      tick += readVLQ()
      let status = d.getUint8(pos)
      if (status < 0x80) status = running
      else {
        pos++
        if (status < 0xf0) running = status
      }
      const hi = status & 0xf0
      const ch = status & 0x0f

      if (status === 0xff) {
        const type = d.getUint8(pos++)
        const mlen = readVLQ()
        if (type === 0x51 && mlen === 3) {
          tempoUs = (d.getUint8(pos) << 16) | (d.getUint8(pos + 1) << 8) | d.getUint8(pos + 2)
        }
        pos += mlen
      } else if (status === 0xf0 || status === 0xf7) {
        pos += readVLQ()
      } else if (hi === 0x80 || hi === 0x90) {
        const note = d.getUint8(pos++)
        const vel = d.getUint8(pos++)
        const key = (ch << 8) | note
        if (hi === 0x90 && vel > 0) {
          onMap.set(key, { tick, vel })
        } else {
          const st = onMap.get(key)
          if (st) {
            rawNotes.push({ note, vel: st.vel, ch, startTick: st.tick, endTick: tick })
            onMap.delete(key)
          }
        }
      } else if (hi === 0xa0 || hi === 0xb0 || hi === 0xe0) {
        pos += 2
      } else if (hi === 0xc0 || hi === 0xd0) {
        pos += 1
      } else {
        break
      }
    }
    pos = end
  }

  rawNotes.sort((a, b) => a.startTick - b.startTick)
  return { format, ticksPerBeat, tempoUs, notes: rawNotes }
}

function tickToSec(tick, ticksPerBeat, tempoUs) {
  return (tick * (tempoUs / 1e6)) / ticksPerBeat
}

function waveForProgram() {
  return 'triangle'
}

function freqOf(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}

export class MidiPlayer {
  constructor() {
    this._gen = 0
    this.ctx = null
    this.master = null
    this.source = null
    this.playing = false
    this.loop = true
    this.volume = 0.22
    this._bufCache = new Map()
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext
      if (!AC) throw new Error('当前环境不支持 Web Audio')
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state !== 'running' && this.ctx.resume) {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, Number(v) || 0))
    if (this.master) this.master.gain.value = this.volume
  }

  /** 离线渲染 MIDI → AudioBuffer */
  async renderMidi(buf, cacheKey) {
    if (cacheKey && this._bufCache.has(cacheKey)) return this._bufCache.get(cacheKey)
    const midi = parseMidi(buf)
    if (!midi.notes.length) throw new Error('MIDI 无音符')

    const notes = midi.notes
      .filter(n => n && n.endTick > n.startTick && n.vel > 0)
      .slice(0, 2500)
    const lastTick = Math.max(...notes.map(n => n.endTick), 1)
    const duration = Math.min(180, tickToSec(lastTick, midi.ticksPerBeat, midi.tempoUs) + 0.15)
    const sampleRate = 22050
    const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext
    if (!OAC) throw new Error('当前环境不支持离线音频渲染')
    const frames = Math.ceil(duration * sampleRate)
    const off = new OAC(1, frames, sampleRate)

    const MAX_VOICES = 24
    let voices = 0
    let lastKick = -1
    for (const n of notes) {
      const s = tickToSec(n.startTick, midi.ticksPerBeat, midi.tempoUs)
      const e = tickToSec(Math.max(n.endTick, n.startTick + 1), midi.ticksPerBeat, midi.tempoUs)
      const dur = Math.max(0.04, Math.min(1.6, e - s))
      if (s < lastKick) {
        voices++
        if (voices > MAX_VOICES) continue
      } else {
        voices = 1
        lastKick = s
      }
      try {
        const osc = off.createOscillator()
        const g = off.createGain()
        osc.type = waveForProgram()
        osc.frequency.value = freqOf(n.note)
        const amp = Math.min(0.22, 0.05 + (n.vel / 127) * 0.16)
        g.gain.setValueAtTime(0.0001, s)
        g.gain.linearRampToValueAtTime(amp, s + 0.025)
        g.gain.linearRampToValueAtTime(0.0001, s + dur)
        osc.connect(g)
        g.connect(off.destination)
        osc.start(s)
        osc.stop(s + dur + 0.02)
      } catch (e) { /* skip */ }
    }

    const rendered = await off.startRendering()
    if (cacheKey) {
      this._bufCache.set(cacheKey, rendered)
      if (this._bufCache.size > 6) {
        const first = this._bufCache.keys().next().value
        this._bufCache.delete(first)
      }
    }
    return rendered
  }

  async playArrayBuffer(buf, cacheKey) {
    this.stop()
    const gen = this._gen
    this._ensureCtx()
    let audioBuf
    try {
      audioBuf = await this.renderMidi(buf, cacheKey)
    } catch (e) {
      this.playing = false
      return { ok: false, error: (e && e.message) || '渲染失败' }
    }
    if (gen !== this._gen) return { ok: false, error: '已取消', aborted: true }
    if (!this.ctx) return { ok: false, error: '音频上下文不可用' }
    const src = this.ctx.createBufferSource()
    src.buffer = audioBuf
    src.loop = this.loop
    src.connect(this.master)
    src.onended = () => {
      if (this.source === src) {
        this.playing = false
        this.source = null
      }
    }
    try {
      src.start()
    } catch (e) {
      return { ok: false, error: (e && e.message) || '播放失败' }
    }
    this.source = src
    this.playing = true
    return { ok: true, duration: audioBuf.duration, notes: (audioBuf && audioBuf.length) || 0 }
  }

  async playUrl(url, cacheKey) {
    let buf
    const host = globalThis.awHost && globalThis.awHost.asset
    if (host && host.read) {
      const r = await host.read(url)
      if (!r || !r.ok) return { ok: false, error: (r && r.error) || '读取失败' }
      const bin = Uint8Array.from(atob(r.data), c => c.charCodeAt(0))
      buf = bin.buffer
    } else {
      const res = await fetch(url)
      if (!res.ok) return { ok: false, error: '读取失败 ' + res.status }
      buf = await res.arrayBuffer()
    }
    return this.playArrayBuffer(buf, cacheKey || url)
  }

  stop() {
    this._gen = (this._gen || 0) + 1
    this.playing = false
    if (this.source) {
      try {
        this.source.onended = null
        this.source.stop()
      } catch (e) { /* ignore */ }
      try { this.source.disconnect() } catch (e) { /* ignore */ }
      this.source = null
    }
  }
}

export function isMidiFile(name) {
  return /\.(mid|midi)$/i.test(String(name || ''))
}
