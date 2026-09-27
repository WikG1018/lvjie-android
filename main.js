// 《旅界》Electron 主进程（Packed：resources/app/main.js）
// 由 runtime/AgentWorlds.exe 加载；require('electron') 为内建 API
if (process.env.ELECTRON_RUN_AS_NODE) delete process.env.ELECTRON_RUN_AS_NODE

const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron')
// 允许程序化启动 BGM（需在 app 使用前声明，但必须在 require 之后）
try {
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
} catch (e) { /* ignore */ }
const path = require('path')
const fs = require('fs')

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  console.error('[AgentWorlds] 已有实例在运行，本进程退出（单实例锁）')
  app.quit()
  // 不再注册窗口逻辑
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0]
    if (w) {
      if (w.isMinimized()) w.restore()
      w.focus()
    }
  })
}

function resolveIndex() {
  const p = path.join(__dirname, 'index.html')
  return fs.existsSync(p) ? p : path.join(__dirname, 'app', 'index.html')
}

function resolveIcon() {
  const c = [
    path.join(__dirname, 'assets', 'icon.ico'),
    path.join(__dirname, 'icon.ico')
  ]
  for (const p of c) if (fs.existsSync(p)) return p
  return undefined
}

function resolvePreload() {
  const c = [
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'app', 'preload.js')
  ]
  for (const p of c) if (fs.existsSync(p)) return p
  return undefined
}

function secretsPath() {
  return path.join(app.getPath('userData'), 'agentworlds_apikeys.bin')
}

/** 读取资源文件（渲染层 file:// 下 fetch 可能被拦） */
ipcMain.handle('aw:asset:read', async (_e, rel) => {
  try {
    const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '')
    if (!clean || clean.includes('..')) return { ok: false, error: '非法路径' }
    // 仅允许 assets/ 与 music/ 资源，禁止读源码
    if (!/^(assets|music|audio)\//i.test(clean) && !/\.(png|jpg|jpeg|svg|ico|mp3|wav|ogg|m4a|mid|ttf|woff2?)$/i.test(clean)) {
      return { ok: false, error: '资源类型不被允许' }
    }
    const base = __dirname
    const p = path.join(base, clean)
    const rootPath = path.resolve(base) + path.sep
    const abs = path.resolve(p)
    if (abs !== path.resolve(base) && !abs.startsWith(rootPath)) return { ok: false, error: '路径越界' }
    if (!fs.existsSync(p)) return { ok: false, error: '文件不存在' }
    const buf = fs.readFileSync(p)
    return {
      ok: true,
      data: buf.toString('base64'),
      type: /\.mid$/i.test(p) ? 'audio/midi' : 'application/octet-stream'
    }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '读取失败' }
  }
})

/* ---------- HTTP 代理：渲染进程不直连外网 ---------- */
const ALLOWED_HTTP = /^https?:\/\//i
let streamSeq = 0
const streamCtl = new Map()

function allowedHttpUrl(raw) {
  try {
    const u = new URL(String(raw))
    let h = u.hostname.toLowerCase()
    // 去掉 IPv6 括号与尾点，避免字符串绕过
    if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1)
    h = h.replace(/\.$/, '')
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0:0:0:0:0:0:0:1') return true
    // 拒绝云元数据 / 链路本地 / 未指定
    const deny = ['0.0.0.0', '169.254.169.254', 'metadata.google.internal', 'metadata.google', 'metadata']
    if (deny.includes(h)) return false
    // IPv4-mapped IPv6 / 十六进制 IP 归一后再判
    const norm = normalizeHostIp(h)
    if (norm && isBlockedIp(norm)) return false
    // 内网段：允许自建 API，但拒绝链路本地与 CGNAT
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(norm || h)) return true
    return true
  } catch (e) {
    return false
  }
}

function normalizeHostIp(h) {
  let s = String(h || '').toLowerCase()
  // [::ffff:169.254.169.254] 已剥括号
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(s)
  if (mapped) return mapped[1]
  // 纯十进制 / 十六进制 IPv4
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
    }
    return null
  }
  if (/^0x[0-9a-f]+$/.test(s)) {
    const n = parseInt(s, 16)
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
    }
    return null
  }
  return s
}

function isBlockedIp(ip) {
  const s = String(ip || '')
  if (!s) return false
  // 链路本地 / 云元数据 / CGNAT / 未指定 / 回环以外的特殊段
  if (/^169\.254\./.test(s)) return true
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(s)) return true // CGNAT 100.64/10
  if (/^(0\.|127\.|224\.|240\.)/.test(s)) return true
  if (/^fe80:/i.test(s) || /^fc00:/i.test(s) || /^fd/i.test(s)) return true // IPv6 ULA/link-local
  return false
}

function rejectHttp(url, method) {
  if (!ALLOWED_HTTP.test(url)) return { ok: false, error: '仅允许 http(s) 协议' }
  const m = String(method || 'GET').toUpperCase()
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(m)) {
    return { ok: false, error: '不允许的 HTTP 方法' }
  }
  return null
}

function sameOrigin(a, b) {
  try {
    const ua = new URL(a)
    const ub = new URL(b)
    return ua.protocol === ub.protocol && ua.host === ub.host
  } catch (e) {
    return false
  }
}

function stripSensitiveHeaders(headers) {
  const out = {}
  for (const [k, v] of Object.entries(headers || {})) {
    const lk = String(k).toLowerCase()
    if (lk === 'authorization' || lk === 'cookie' || lk === 'proxy-authorization') continue
    out[k] = v
  }
  return out
}

ipcMain.handle('aw:http', async (_e, req) => {
  const url = String((req && req.url) || '')
  const method = String((req && req.method) || 'GET').toUpperCase()
  const bad = rejectHttp(url, method)
  if (bad) return bad
  if (!allowedHttpUrl(url)) return { ok: false, error: '地址不被允许' }
  const timeoutMs = Math.max(1000, Math.min(180000, Number(req.timeoutMs) || 120000))
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetchChecked(url, {
      method,
      headers: (req && req.headers) || {},
      body: method === 'GET' || method === 'HEAD' ? undefined : (req && req.body),
      signal: ctl.signal
    })
    if (res && res.ok === false) return res
    const text = await res.text()
    return {
      ok: true,
      status: res.status,
      statusText: res.statusText,
      text,
      headers: Object.fromEntries(res.headers.entries())
    }
  } catch (e) {
    const aborted = e && (e.name === 'AbortError' || e.name === 'TimeoutError')
    return { ok: false, error: aborted ? '请求超时或已取消' : ((e && e.message) || '网络错误'), aborted }
  } finally {
    clearTimeout(timer)
  }
})

/** 逐跳校验 redirect，防 30x 绕过 deny 名单；跨 origin 剥掉认证头 */
async function fetchChecked(url, opts, hop = 0) {
  if (hop > 5) return { ok: false, error: '重定向过多' }
  if (!allowedHttpUrl(url)) return { ok: false, error: '地址不被允许' }
  const res = await fetch(url, Object.assign({}, opts, { redirect: 'manual' }))
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = res.headers.get('location')
    if (!loc) return res
    let next = loc
    try {
      next = new URL(loc, url).toString()
    } catch (e) {
      return { ok: false, error: '非法重定向地址' }
    }
    if (!allowedHttpUrl(next)) return { ok: false, error: '重定向目标不被允许' }
    const method = (opts && opts.method) || 'GET'
    // 301/302/303 对非 GET 降级 GET 并丢 body
    const downgrade = res.status === 303 || ((res.status === 301 || res.status === 302) && method !== 'GET' && method !== 'HEAD')
    const m = downgrade ? 'GET' : method
    let headers = (opts && opts.headers) || {}
    if (!sameOrigin(url, next)) headers = stripSensitiveHeaders(headers)
    return fetchChecked(next, Object.assign({}, opts, {
      method: m,
      headers,
      body: m === 'GET' || m === 'HEAD' ? undefined : (opts && opts.body)
    }), hop + 1)
  }
  return res
}

/** 流式：启动后按 chunk 回传，end/error 收尾 */
ipcMain.handle('aw:http:stream', (event, req) => {
  const url = String((req && req.url) || '')
  const method = String((req && req.method) || 'GET').toUpperCase()
  const bad = rejectHttp(url, method)
  if (bad) return bad
  if (!allowedHttpUrl(url)) return { ok: false, error: '地址不被允许' }
  const id = 's' + (++streamSeq)
  const ctl = new AbortController()
  streamCtl.set(id, ctl)
  const timeoutMs = Math.max(1000, Math.min(180000, Number(req.timeoutMs) || 180000))
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  const sender = event.sender

function safeSend(channel, payload) {
  try {
    if (sender.isDestroyed()) return
    sender.send(channel, payload)
  } catch (e) { /* ignore */ }
}

  ;(async () => {
    try {
      const res = await fetchChecked(url, {
        method,
        headers: (req && req.headers) || {},
        body: method === 'GET' || method === 'HEAD' ? undefined : (req && req.body),
        signal: ctl.signal
      })
      if (res && res.ok === false) {
        safeSend('aw:http:end', { id, ok: false, error: res.error || '地址不被允许' })
        return
      }
      safeSend('aw:http:head', { id, status: res.status, headers: Object.fromEntries(res.headers.entries()) })
      if (!res.body) {
        const text = await res.text()
        safeSend('aw:http:chunk', { id, text })
        safeSend('aw:http:end', { id, ok: true })
        return
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder('utf-8')
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        safeSend('aw:http:chunk', { id, text: dec.decode(value, { stream: true }) })
      }
      safeSend('aw:http:chunk', { id, text: dec.decode() })
      safeSend('aw:http:end', { id, ok: true, status: res.status })
    } catch (e) {
      const aborted = e && (e.name === 'AbortError' || e.name === 'TimeoutError')
      safeSend('aw:http:end', {
        id,
        ok: false,
        aborted,
        error: aborted ? '请求超时或已取消' : ((e && e.message) || '网络错误')
      })
    } finally {
      clearTimeout(timer)
      streamCtl.delete(id)
    }
  })()

  return { ok: true, id }
})

ipcMain.handle('aw:http:abort', (_e, id) => {
  const ctl = streamCtl.get(String(id))
  if (ctl) {
    try { ctl.abort() } catch (err) { /* ignore */ }
    streamCtl.delete(String(id))
    return { ok: true }
  }
  return { ok: false }
})

/* ---------- API Key：safeStorage 加密落盘 ---------- */
ipcMain.handle('aw:secrets:load', () => {
  try {
    const p = secretsPath()
    if (!fs.existsSync(p)) return null
    const buf = fs.readFileSync(p)
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(buf)
      : buf.toString('utf8')
    const data = JSON.parse(json)
    return data && typeof data === 'object' ? data : null
  } catch (e) {
    return null
  }
})

ipcMain.handle('aw:secrets:save', (_e, payload) => {
  try {
    const json = JSON.stringify(payload || { keys: [], selected: 0 })
    const buf = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(json)
      : Buffer.from(json, 'utf8')
    fs.writeFileSync(secretsPath(), buf)
    return { ok: true, encrypted: safeStorage.isEncryptionAvailable() }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '保存失败' }
  }
})

ipcMain.handle('aw:secrets:clear', () => {
  try { fs.rmSync(secretsPath(), { force: true }) } catch (e) { /* ignore */ }
  return { ok: true }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0f1e',
    autoHideMenuBar: true,
    icon: resolveIcon(),
    title: '旅界',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: resolvePreload()
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    const file = 'file://'
    const ok = url.startsWith(file) || url.startsWith('about:')
    if (!ok) e.preventDefault()
  })

  win.once('ready-to-show', () => win.show())
  win.loadFile(resolveIndex())

  win.webContents.on('did-finish-load', () => {
    if (process.env.XX_SMOKE_TEST) {
      win.webContents.executeJavaScript(
        `Promise.resolve().then(() => ({
           title: document.title,
           packs: (globalThis.__AW_PACKS__ && Object.keys(globalThis.__AW_PACKS__).length) || (document.querySelectorAll('.pack-card') || []).length,
           packCards: (document.querySelectorAll('.pack-card') || []).length,
           hasApp: !!document.getElementById('app'),
           hasWelcome: !document.getElementById('welcome')?.hidden
         }))`
      )
        .then(r => console.log('SMOKE=' + JSON.stringify(r)))
        .catch(e => console.log('SMOKE_ERR=' + e.message))
      setTimeout(() => app.exit(0), 5000)
    }
  })
}

if (gotLock) {
  app.whenReady().then(createWindow)
}
app.on('window-all-closed', () => app.quit())
