// 联网补充设定：国内优先（萌娘/百度百科），维基作可选回退；用户设定页 URL

const UA_HEADERS = {
  'Accept': 'application/json, text/html;q=0.9,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (compatible; AgentWorlds/0.1; +local)'
}

async function httpGet(url, timeoutMs = 25000, signal) {
  const host = globalThis.awHost && globalThis.awHost.http
  if (host && host.request) {
    try {
      const r = await host.request({ url, method: 'GET', headers: UA_HEADERS, timeoutMs })
      if (signal && signal.aborted) return { ok: false, error: '已取消', aborted: true }
      if (!r || !r.ok) return { ok: false, error: (r && r.error) || '网络错误' }
      return { ok: true, text: r.text || '', status: r.status }
    } catch (e) {
      return { ok: false, error: (e && e.message) || '网络错误' }
    }
  }
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), timeoutMs)
  const onAbort = () => ctl.abort()
  if (signal) {
    if (signal.aborted) { clearTimeout(t); return { ok: false, error: '已取消', aborted: true } }
    signal.addEventListener('abort', onAbort, { once: true })
  }
  try {
    const res = await fetch(url, { method: 'GET', headers: UA_HEADERS, signal: ctl.signal })
    const text = await res.text()
    return { ok: true, text, status: res.status }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '网络错误', aborted: !!(signal && signal.aborted) }
  } finally {
    clearTimeout(t)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}

/** 从 HTML 抽正文文本（粗去噪） */
export function htmlToText(html) {
  let s = String(html || '')
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  s = s.replace(/&quot;/g, '"')
  s = s.replace(/&#\d+;/g, ' ')
  s = s.replace(/[ \t]+\n/g, '\n')
  s = s.replace(/\s{2,}/g, ' ')
  return s.trim()
}

function looksBlocked(text) {
  const s = String(text || '')
  if (s.length < 80) return true
  return /验证码|访问异常|安全验证|禁止访问|Access Denied|Just a moment/i.test(s.slice(0, 800))
}

function mediaWikiExtract(jsonText) {
  try {
    const j = JSON.parse(jsonText)
    const pages = j && j.query && j.query.pages
    if (!pages) return null
    const page = pages[Object.keys(pages)[0]]
    const text = page && page.extract
    if (text && String(text).trim().length > 80) {
      return {
        title: page.title || '',
        text: String(text).trim().slice(0, 14000)
      }
    }
  } catch (e) { /* not json */ }
  return null
}

/** 萌娘百科（国内可访问，网文/ACG 条目多） */
export async function fetchMoegirl(title) {
  const q = encodeURIComponent(String(title || '').trim())
  if (!q) return { ok: false, error: '缺少书名' }
  // 搜索定条目名
  const searchUrl = `https://zh.moegirl.org.cn/api.php?action=query&list=search&srsearch=${q}&format=json&utf8=1&srlimit=3`
  const sr = await httpGet(searchUrl)
  let pageTitle = title
  if (sr.ok) {
    try {
      const j = JSON.parse(sr.text)
      const hit = j && j.query && j.query.search && j.query.search[0]
      if (hit && hit.title) pageTitle = hit.title
    } catch (e) { /* keep */ }
  }
  const extractUrl = `https://zh.moegirl.org.cn/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(pageTitle)}&format=json&utf8=1&redirects=1`
  const er = await httpGet(extractUrl)
  if (!er.ok) return er
  const hit = mediaWikiExtract(er.text)
  if (!hit) return { ok: false, error: '萌娘百科未找到条目' }
  return { ok: true, source: 'zh.moegirl.org.cn', title: hit.title, text: hit.text }
}

/** 百度百科（接口卡片 + 条目页，失败则跳过） */
export async function fetchBaiduBaike(title) {
  const name = String(title || '').trim()
  if (!name) return { ok: false, error: '缺少书名' }
  const cardUrl = 'https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_length=1200&bk_key=' + encodeURIComponent(name)
  const card = await httpGet(cardUrl)
  if (card.ok && !looksBlocked(card.text)) {
    try {
      const j = JSON.parse(card.text)
      const abstract = j && (j.abstract || j.abs || j.description || '')
      const titleHit = (j && (j.title || j.key)) || name
      const desc = (j && (j.desc || '')) + ''
      const body = [desc, String(abstract)].filter(Boolean).join('\n')
      if (body.length > 60) {
        return {
          ok: true,
          source: 'baike.baidu.com',
          title: titleHit,
          text: body.slice(0, 5000)
        }
      }
    } catch (e) { /* fallthrough */ }
  }
  const pageUrl = 'https://baike.baidu.com/item/' + encodeURIComponent(name)
  const page = await httpGet(pageUrl, 30000)
  if (!page.ok) return { ok: false, error: '百度百科不可达' }
  const text = htmlToText(page.text)
  if (looksBlocked(text)) return { ok: false, error: '百度百科拦截或正文过短' }
  return { ok: true, source: 'baike.baidu.com', title: name, text: text.slice(0, 10000) }
}

/** 中/英维基百科（部分网络不可达，作回退） */
export async function fetchWikipedia(title) {
  const q = encodeURIComponent(String(title || '').trim())
  if (!q) return { ok: false, error: '缺少书名' }
  const apis = [
    { host: 'zh.wikipedia.org', lang: 'zh' },
    { host: 'en.wikipedia.org', lang: 'en' }
  ]
  for (const api of apis) {
    const searchUrl = `https://${api.host}/w/api.php?action=query&list=search&srsearch=${q}&format=json&utf8=1&srlimit=3`
    const sr = await httpGet(searchUrl)
    if (!sr.ok) continue
    let pageTitle = title
    try {
      const j = JSON.parse(sr.text)
      const hit = j && j.query && j.query.search && j.query.search[0]
      if (hit && hit.title) pageTitle = hit.title
    } catch (e) { /* use raw title */ }

    const extractUrl = `https://${api.host}/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=plain&titles=${encodeURIComponent(pageTitle)}&format=json&utf8=1&redirects=1`
    const er = await httpGet(extractUrl)
    if (!er.ok) continue
    const hit = mediaWikiExtract(er.text)
    if (hit) {
      return { ok: true, source: api.lang + '.wikipedia.org', title: hit.title, text: hit.text }
    }
  }
  return { ok: false, error: '维基未找到或不可达' }
}

/** 用户提供的设定页 URL */
export async function fetchSettingUrl(url) {
  const u = String(url || '').trim()
  if (!/^https?:\/\//i.test(u)) return { ok: false, error: 'URL 需以 http(s) 开头' }
  // MediaWiki API JSON 直接解析
  if (/api\.php/i.test(u) && /format=json/i.test(u)) {
    const r = await httpGet(u, 30000)
    if (!r.ok) return r
    const hit = mediaWikiExtract(r.text)
    if (hit) return { ok: true, text: hit.text, source: u, title: hit.title }
    const text = String(r.text || '').slice(0, 15000)
    if (text.length > 40) return { ok: true, text, source: u }
    return { ok: false, error: '接口未返回可用正文' }
  }
  const r = await httpGet(u, 30000)
  if (!r.ok) return r
  const text = htmlToText(r.text)
  if (looksBlocked(text)) return { ok: false, error: '页面被拦截或正文过短' }
  return { ok: true, text: text.slice(0, 15000), source: u }
}

/**
 * 汇总联网材料：国内信源优先
 * @param {{ title, urls?: string[], onProgress?: Function, useWiki?: boolean }} opt
 */
export async function gatherWebLore({ title, urls, onProgress, useWiki }) {
  const report = onProgress || (() => {})
  const notes = []
  const attempts = []

  const sources = [
    { name: '萌娘百科', fn: () => fetchMoegirl(title) },
    { name: '百度百科', fn: () => fetchBaiduBaike(title) }
  ]
  if (useWiki) {
    sources.push({ name: '维基百科', fn: () => fetchWikipedia(title) })
  }

  for (const s of sources) {
    if (!title) break
    report({ message: `查询${s.name}…` })
    try {
      const r = await s.fn()
      attempts.push({ name: s.name, ok: r.ok, detail: r.ok ? (r.title || '') : (r.error || '') })
      if (r.ok) {
        notes.push({ kind: 'wiki', source: r.source, title: r.title, text: r.text })
        report({ message: `已获取${s.name}《${r.title || title}》${r.text.length} 字` })
        // 国内源拿到两份即可；维基仅在勾选后作为补充
        const wikiHits = notes.filter(n => n.source && /wikipedia/i.test(n.source)).length
        const cnHits = notes.filter(n => n.source && !/wikipedia/i.test(n.source)).length
        if (s.name !== '维基百科' && cnHits >= 2) break
        if (s.name === '维基百科' && wikiHits >= 1 && cnHits >= 1) break
      } else {
        report({ message: `${s.name}：${r.error || '未命中'}` })
      }
    } catch (e) {
      attempts.push({ name: s.name, ok: false, detail: e && e.message })
    }
  }

  const list = Array.isArray(urls) ? urls.map(s => String(s || '').trim()).filter(Boolean) : []
  for (let i = 0; i < list.length; i++) {
    report({ message: `抓取设定页 ${i + 1}/${list.length}…` })
    const r = await fetchSettingUrl(list[i])
    if (r.ok) {
      notes.push({ kind: 'url', source: list[i], text: r.text })
    } else {
      report({ message: `设定页失败：${r.error || list[i]}` })
    }
  }

  return { ok: notes.length > 0, notes, attempts }
}

/** 角色条目查询：作品名+人名 / 人名 */
export async function fetchCharacterLore(name, workTitle) {
  const n = String(name || '').trim()
  if (!n || n.length > 12) return { ok: false, error: '人名无效' }
  const queries = [
    workTitle ? `${n}（${workTitle}）` : n,
    workTitle ? `${n} ${workTitle}` : n,
    n
  ]
  const notes = []
  for (const q of queries) {
    try {
      const m = await fetchMoegirl(q)
      if (m.ok && m.text.length > 100) {
        notes.push({ kind: 'char', source: m.source, title: m.title, text: m.text.slice(0, 4000) })
      }
    } catch (e) { /* next */ }
    if (notes.length) break
    try {
      const b = await fetchBaiduBaike(q)
      if (b.ok && b.text.length > 100) {
        notes.push({ kind: 'char', source: b.source, title: b.title, text: b.text.slice(0, 3000) })
      }
    } catch (e) { /* next */ }
    if (notes.length) break
  }
  return notes.length
    ? { ok: true, name: n, notes }
    : { ok: false, name: n, error: '未找到角色条目' }
}

/** 压进合并提示词的补充块 */
export function webNotesToBlock(notes) {
  if (!Array.isArray(notes) || !notes.length) return ''
  return notes.map((n, i) => {
    const head = n.kind === 'wiki' ? '百科/条目' : (n.kind === 'char' ? '角色条目' : '设定页')
    return `【补充${i + 1}·${head}】${n.source || ''}\n${String(n.text || '').slice(0, 8000)}`
  }).join('\n\n')
}
