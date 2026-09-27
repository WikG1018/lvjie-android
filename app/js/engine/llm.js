// 自定义 LLM 接入：不绑定厂商，仅需 Base URL + API Key + 模型 + 协议
// apiStyle: 'chat'     → POST {base}/chat/completions   (OpenAI Chat Completions)
//           'response' → POST {base}/responses          (OpenAI Responses API)
// 走 awHost.http（主进程代理）；无宿主时回退 fetch（Node 冒烟）

const DEFAULT_TIMEOUT_MS = 120000
const MAX_TOKENS = 2000
export const MAX_TOKENS_DRAFT = 8000

/** 归一化玩家 Key 对象 */
export function normalizeApiKey(k) {
  if (!k || typeof k !== 'object') return null
  const apiStyle = (k.apiStyle === 'response' || k.style === 'response') ? 'response' : 'chat'
  const baseUrl = String(k.baseUrl || k.url || k.endpoint || '').trim().replace(/\/+$/, '')
  const key = String(k.key || k.value || k.token || '').trim()
  const model = String(k.model || '').trim()
  const name = String(k.name || k.label || model || '自定义').trim()
  if (!baseUrl || !key || !model) return null
  return { name, baseUrl, key, model, apiStyle }
}

export function maskKey(key) {
  const s = String(key || '')
  return s ? '••••••••' : ''
}

/** 把 Base URL 拼成最终 endpoint */
export function endpointOf(k) {
  const base = String(k.baseUrl || '').replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) return ''
  if (k.apiStyle === 'response') {
    if (/\/responses$/i.test(base)) return base
    return base + '/responses'
  }
  if (/\/chat\/completions$/i.test(base)) return base
  if (/\/v\d+$/i.test(base)) return base + '/chat/completions'
  if (/\/completions$/i.test(base)) return base
  return base + '/chat/completions'
}

function messagesToResponseInput(messages) {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }))
}

function extractResponseText(data) {
  if (!data) return ''
  if (typeof data.output_text === 'string' && data.output_text) return data.output_text
  if (typeof data.output === 'string') return data.output
  if (Array.isArray(data.output)) {
    const parts = []
    for (const item of data.output) {
      if (!item) continue
      if (typeof item.content === 'string') { parts.push(item.content); continue }
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (!c) continue
          if (typeof c.text === 'string') parts.push(c.text)
          else if (typeof c.content === 'string') parts.push(c.content)
        }
      }
      if (typeof item.text === 'string') parts.push(item.text)
    }
    return parts.join('\n').trim()
  }
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content || ''
  }
  return ''
}

/** 统一 HTTP：主进程代理优先 */
async function httpSend({ url, method, headers, body, timeoutMs, signal }) {
  const ms = timeoutMs || DEFAULT_TIMEOUT_MS
  const host = globalThis.awHost && globalThis.awHost.http
  if (host && host.request) {
    // 主进程代理；本地 signal 仅用于 UI 取消时忽略过期结果
    const r = await host.request({ url, method, headers, body, timeoutMs: ms })
    if (signal && signal.aborted) {
      const err = new Error('已取消')
      err.name = 'AbortError'
      throw err
    }
    if (!r || !r.ok) {
      const err = new Error((r && r.error) || '网络错误')
      if (r && r.aborted) err.name = 'AbortError'
      throw err
    }
    return { status: r.status, text: r.text }
  }

  const timeoutCtl = new AbortController()
  const timer = setTimeout(() => timeoutCtl.abort(), ms)
  let combined = timeoutCtl.signal
  if (signal) {
    if (typeof AbortSignal.any === 'function') {
      combined = AbortSignal.any([signal, timeoutCtl.signal])
    } else {
      signal.addEventListener('abort', () => timeoutCtl.abort(), { once: true })
    }
  }
  try {
    const res = await fetch(url, { method, headers, body, signal: combined })
    const text = await res.text()
    return { status: res.status, text }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 调用一次 LLM。
 * @returns {Promise<{ok:boolean, text?:string, error?:string, aborted?:boolean}>}
 */
export async function callLLM({ keyObj, system, user, history = [], signal, onDelta, maxTokens }) {
  const k = normalizeApiKey(keyObj)
  if (!k) {
    return { ok: false, error: '未配置有效的 API（需要 Base URL、Key、模型）' }
  }

  const messages = []
  if (system) messages.push({ role: 'system', content: system })
  for (const h of history) {
    if (h && h.role && h.content != null) messages.push({ role: h.role, content: h.content })
  }
  messages.push({ role: 'user', content: user })

  const url = endpointOf(k)
  if (!url) return { ok: false, error: 'Base URL 必须以 http(s):// 开头' }

  const tokenCap = Math.max(256, Math.min(16000, Number(maxTokens) || MAX_TOKENS))
  const isChat = k.apiStyle !== 'response'
  let body
  if (!isChat) {
    body = {
      model: k.model,
      input: messagesToResponseInput(messages),
      temperature: 0.9,
      max_output_tokens: tokenCap
    }
  } else {
    body = {
      model: k.model,
      messages,
      temperature: 0.9,
      max_tokens: tokenCap
    }
  }

  // 流式：chat / response 均支持；宿主 stream + 增量回调
  const canStream = typeof onDelta === 'function' && globalThis.awHost && globalThis.awHost.http && globalThis.awHost.http.stream
  if (canStream) {
    body.stream = true
    let streamed = null
    try {
      streamed = await callLLMStream({ k, url, body, signal, onDelta, apiStyle: isChat ? 'chat' : 'response' })
    } catch (e) {
      streamed = null
    }
    // 启动失败或零增量失败 → 回退非流式
    if (streamed) return streamed
    delete body.stream
  }

  try {
    const res = await httpSend({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + k.key
      },
      body: JSON.stringify(body),
      timeoutMs: DEFAULT_TIMEOUT_MS,
      signal
    })
    const raw = res.text || ''
    if (res.status < 200 || res.status >= 300) {
      let msg = raw.slice(0, 400)
      try {
        const j = JSON.parse(raw)
        msg = (j.error && (j.error.message || j.error.msg || j.error)) || j.message || msg
        if (typeof msg === 'object') msg = JSON.stringify(msg)
      } catch (e) { /* keep raw */ }
      return { ok: false, error: 'HTTP ' + res.status + ': ' + msg }
    }
    let data
    try { data = JSON.parse(raw) } catch (e) { return { ok: false, error: '响应不是合法 JSON' } }

    let text = normalizeContentText(
      !isChat
        ? extractResponseText(data)
        : (data && data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : extractResponseText(data))
    )
    if (!text) return { ok: false, error: '模型返回空内容' }
    return { ok: true, text }
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, error: '已取消', aborted: true }
    return { ok: false, error: (e && e.message) || '网络错误' }
  }
}

/** content 可能是 string 或 [{type,text}] */
function normalizeContentText(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) {
    return v.map(p => {
      if (typeof p === 'string') return p
      if (p && typeof p.text === 'string') return p.text
      if (p && typeof p.content === 'string') return p.content
      return ''
    }).join('')
  }
  return String(v)
}

/** SSE 流式：chat 读 choices.delta.content；response 读 response.output_text.delta */
async function callLLMStream({ k, url, body, signal, onDelta, apiStyle }) {
  const host = globalThis.awHost.http
  // end 只认本流 id；id 未就绪时挂起，避免并发串扰
  let streamId = null
  const waiters = []
  const endBox = { done: null, p: null }
  endBox.p = new Promise((r) => { endBox.done = r })
  const offEnd0 = host.onEnd((d) => {
    if (!d) return
    if (!streamId) {
      waiters.push(d)
      return
    }
    if (d.id === streamId) endBox.done(d)
  })
  const drainWaiters = () => {
    if (!streamId) return
    for (const d of waiters) {
      if (d && d.id === streamId) endBox.done(d)
    }
    waiters.length = 0
  }
  const started = await host.stream({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + k.key,
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify(body),
    timeoutMs: DEFAULT_TIMEOUT_MS
  })
  if (!started || !started.ok || !started.id) {
    try { offEnd0() } catch (e) { /* ignore */ }
    return null
  }
  const id = started.id
  streamId = id
  drainWaiters()
  const endForId = new Promise((resolve) => {
    endBox.p.then((d) => {
      if (d && (d.id === id || !d.id)) resolve(d)
      else {
        const off = host.onEnd((dd) => {
          if (dd && dd.id === id) { try { off() } catch (e) {} resolve(dd) }
        })
        // 防泄漏：流结束后兜底退订
        setTimeout(() => { try { off() } catch (e) {} }, 200000)
      }
    })
  })
  let buf = ''
  let text = ''
  let status = 200
  let err = null
  let aborted = false

  const onAbort = () => {
    aborted = true
    try { host.abort(id) } catch (e) { /* ignore */ }
  }
  if (signal) {
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  const pushDelta = (delta) => {
    if (!delta) return
    text += delta
    try { onDelta(delta, text) } catch (e) { /* ignore */ }
  }

  const offChunk = host.onChunk((d) => {
    if (!d || d.id !== id) return
    buf += d.text || ''
    let nl
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '')
      buf = buf.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const j = JSON.parse(payload)
        const delta = extractStreamDelta(j, apiStyle)
        if (delta) pushDelta(delta)
      } catch (e) { /* partial json */ }
    }
  })
  const offEnd = host.onEnd((d) => {
    if (!d || d.id !== id) return
    status = d.status || status
    if (!d.ok) err = d.error || '流式失败'
    if (d.aborted) aborted = true
    endBox.done(d)
  })
  const settled = { end: null }
  const endPromise = endForId.then((d) => {
    if (d) {
      status = d.status || status
      if (!d.ok) err = d.error || '流式失败'
      if (d.aborted) aborted = true
    }
    settled.end = true
    return true
  })

  await Promise.race([endPromise, waitStreamEnd(host, id)])
  if (!settled.end && !text) {
    try { offEnd0() } catch (e) { /* ignore */ }
    try { offChunk() } catch (e) { /* ignore */ }
    try { offEnd() } catch (e) { /* ignore */ }
    if (signal) signal.removeEventListener('abort', onAbort)
    return null
  }
  let incomplete = false
  if (!settled.end && text && err == null && !aborted) {
    // 超时/半截：仍返回文本，但标记不完整
    incomplete = true
  }
  try { offEnd0() } catch (e) { /* ignore */ }
  try { offChunk() } catch (e) { /* ignore */ }
  try { offEnd() } catch (e) { /* ignore */ }
  if (signal) signal.removeEventListener('abort', onAbort)

  // 零增量失败 → 让上层回退非流式
  const gotText = text.trim().length > 0
  if (!gotText) return null
  if (aborted) return { ok: false, error: '已取消', aborted: true }
  if (err) return { ok: false, error: err }
  if (status < 200 || status >= 300) return { ok: false, error: 'HTTP ' + status }
  return { ok: true, text, incomplete: incomplete || undefined }
}

/** 从 SSE JSON 里抠增量文本 */
export function extractStreamDelta(j, apiStyle) {
  if (!j || typeof j !== 'object') return ''
  if (apiStyle === 'response') {
    // Responses API: {type:'response.output_text.delta', delta:'...'}
    const t = String(j.type || '')
    if (typeof j.delta === 'string' && /(^|\.)delta$|output_text\.delta|text\.delta/i.test(t)) return j.delta
    // 兼容少量网关直接给 output_text
    if (typeof j.output_text === 'string') return j.output_text
    if (j.choices && j.choices[0] && j.choices[0].delta && typeof j.choices[0].delta.content === 'string') {
      return j.choices[0].delta.content
    }
    return ''
  }
  // chat completions
  if (j.choices && j.choices[0] && j.choices[0].delta) {
    const c = j.choices[0].delta.content
    if (typeof c === 'string') return c
    if (Array.isArray(c)) {
      return c.map(p => (p && typeof p.text === 'string') ? p.text : '').join('')
    }
  }
  return ''
}

function waitStreamEnd(host, id, maxMs = 185000) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      clearInterval(timer)
      try { off() } catch (e) { /* ignore */ }
      resolve()
    }
    const timer = setInterval(() => {
      if (Date.now() - t0 > maxMs) {
        try { host.abort(id) } catch (e) { /* ignore */ }
        done()
      }
    }, 250)
    const off = host.onEnd((d) => {
      if (!d || d.id !== id) return
      done()
    })
  })
}

/** 拉取模型列表（OpenAI 兼容 GET {base}/models） */
export async function listModels({ baseUrl, key }) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '')
  const token = String(key || '').trim()
  if (!base) return { ok: false, error: '请先填写 Base URL' }
  if (!/^https?:\/\//i.test(base)) return { ok: false, error: 'Base URL 必须以 http(s):// 开头' }
  if (!token) return { ok: false, error: '请先填写 API Key' }

  let url = base
  if (/\/chat\/completions$/i.test(url)) url = url.replace(/\/chat\/completions$/i, '/models')
  else if (/\/responses$/i.test(url)) url = url.replace(/\/responses$/i, '/models')
  else if (/\/v\d+$/i.test(url) || /\/compatible-mode\/v\d+$/i.test(url)) url = url + '/models'
  else if (/\/models$/i.test(url)) { /* already */ }
  else url = url + '/models'

  try {
    const res = await httpSend({
      url,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      timeoutMs: 30000
    })
    const raw = res.text || ''
    if (res.status < 200 || res.status >= 300) {
      let msg = raw.slice(0, 300)
      try {
        const j = JSON.parse(raw)
        msg = (j.error && (j.error.message || j.error.msg)) || j.message || msg
      } catch (e) { /* keep raw */ }
      return { ok: false, error: 'HTTP ' + res.status + ': ' + msg, url }
    }
    let data
    try { data = JSON.parse(raw) } catch (e) { return { ok: false, error: '响应不是合法 JSON', url } }

    const ids = []
    const list = Array.isArray(data) ? data
      : Array.isArray(data.data) ? data.data
      : Array.isArray(data.models) ? data.models
      : Array.isArray(data.items) ? data.items
      : []
    for (const m of list) {
      const id = typeof m === 'string' ? m : (m && (m.id || m.model || m.name))
      if (id && ids.indexOf(String(id)) < 0) ids.push(String(id))
    }
    if (!ids.length) return { ok: false, error: '未解析到模型 id', url }
    ids.sort()
    return { ok: true, models: ids, url }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '网络错误' }
  }
}

/** 从模型输出中抽出 JSON（优先 ```json 块；降级用括号配对扫描） */
export function extractGameJSON(text) {
  if (text == null) return null
  const s = typeof text === 'string' ? text : String(text)
  if (!s) return null
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) {
    const j = safeParse(fence[1].trim())
    if (j) return sanitizeGameJSON(j)
  }
  const scanned = scanFirstJSON(s)
  if (scanned) {
    const j = safeParse(scanned)
    if (j) return sanitizeGameJSON(j)
  }
  return null
}

/** 在文本中找第一段花括号配对的 JSON 对象（跳过字符串） */
export function scanFirstJSON(text) {
  const s = String(text || '')
  let start = -1
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') { start = i; break }
  }
  if (start < 0) return null
  let depth = 0
  let inStr = false
  let escCh = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (escCh) escCh = false
      else if (c === '\\') escCh = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; continue }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function safeParse(s) {
  try { return JSON.parse(s) } catch (e) { /* try trailing commas */ }
  try {
    // 仅剥离结构层尾逗号：, 后跟 } 或 ] 且不在字符串内
    let out = ''
    let inStr = false
    let escCh = false
    for (let i = 0; i < s.length; i++) {
      const c = s[i]
      if (inStr) {
        out += c
        if (escCh) escCh = false
        else if (c === '\\') escCh = true
        else if (c === '"') inStr = false
        continue
      }
      if (c === '"') { inStr = true; out += c; continue }
      if (c === ',' ) {
        let j = i + 1
        while (j < s.length && /\s/.test(s[j])) j++
        if (s[j] === '}' || s[j] === ']') continue
      }
      out += c
    }
    return JSON.parse(out)
  } catch (e) { return null }
}

function sanitizeGameJSON(j) {
  if (!j || typeof j !== 'object' || Array.isArray(j)) return j
  const out = Object.assign({}, j)
  delete out.thought
  delete out.thinking
  delete out.reasoning
  return out
}
