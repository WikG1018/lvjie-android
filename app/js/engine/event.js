// AI 事件状态机
import { buildSystemPrompt } from './prompt.js'
import { callLLM, extractGameJSON } from './llm-bridge.js'
import { applyChanges, syncGiftsWithNarrative, extractGiftNames } from './changes.js'
import { MAX_EVENT_CHOICES } from './constants.js'

const MAX_HISTORY_MSGS = 20
const MAX_USER_LEN = 2000

/**
 * EV 结构：
 * { kind, target, history:[{role,content}], count, options, ended, loading, error, resultText, changesBrief }
 */
export function startEvent(kind, user, target) {
  return {
    kind,
    target: target || null,
    history: [],
    count: 0,
    options: null,
    ended: false,
    loading: true,
    error: '',
    resultText: '',
    changesBrief: null,
    partial: '',
    _ctl: null,
    _turn: 0
  }
}

/**
 * 发送一轮。S 为存档，hooks 用于渲染回调。
 */
export async function runEventTurn(S, EV, userContent, hooks = {}) {
  if (!EV || EV.ended) return
  if (EV.loading) return // 并发闸

  let userText = String(userContent == null ? '' : userContent).slice(0, MAX_USER_LEN)
  // 扩图提示：外出类行动在用户侧提醒模型补 new_locations
  if (/外出|游历|出发|赶路|探索新地|去.{0,6}(林|山|镇|城|谷|海|岛)/.test(userText) && !/new_locations/.test(userText)) {
    userText += '\n（本轮为外出行动，请尽量在 json.changes.new_locations 添加 1 个新地点及 people/shop）'
  }
  EV.loading = true
  EV.error = ''
  const turn = (EV._turn = (EV._turn || 0) + 1)
  if (hooks.onState) hooks.onState(EV)

  const keyObj = resolveKey(S)
  if (!keyObj) {
    EV.loading = false
    EV.error = '请先在设置中配置 API Key（🔑 切换 API Key）'
    if (hooks.onState) hooks.onState(EV)
    return
  }

  const system = buildSystemPrompt(S, {
    limitOn: hooks.limitOn !== false,
    cheatUnlocked: !!hooks.cheatUnlocked,
    lang: S.lang,
    focusText: userText,
    focusNames: EV.target ? [String(EV.target)] : []
  })

  EV.history.push({ role: 'user', content: userText })
  EV.partial = ''

  const ctl = new AbortController()
  EV._ctl = ctl
  let lastPaint = 0
  let res
  try {
    res = await callLLM({
      keyObj,
      system,
      user: userText,
      history: trimHistory(EV.history.slice(0, -1)),
      signal: ctl.signal,
      onDelta: (delta, acc) => {
        if (EV._turn !== turn) return
        EV.partial = acc
        EV.resultText = stripJSONBlock(acc)
        // 流式每 token 全量重绘会卡，节流刷新
        const now = Date.now()
        if (!hooks.onState) return
        if (now - lastPaint < 120) return
        lastPaint = now
        hooks.onState(EV)
      }
    })
  } catch (e) {
    res = { ok: false, error: (e && e.message) || '调用异常' }
  }

  if (EV._turn !== turn) return // 过期响应丢弃
  if (EV._ctl === ctl) EV._ctl = null

  if (!res.ok) {
    EV.loading = false
    EV.error = res.error || '调用失败'
    EV.partial = ''
    // 回滚最后一条 user，允许重试；并恢复上一轮叙事，避免半截残文
    if (EV.history.length && EV.history[EV.history.length - 1].role === 'user') {
      EV.history.pop()
    }
    const lastAsst = [...EV.history].reverse().find(h => h && h.role === 'assistant')
    EV.resultText = (lastAsst && lastAsst.content) || ''
    if (hooks.onState) hooks.onState(EV)
    return
  }

  const text = normalizeText(res.text)
  const json = extractGameJSON(text)
  const narrative = stripJSONBlock(text)

  // history 只存叙事，避免 JSON 撑爆 token
  EV.history.push({ role: 'assistant', content: narrative || text.slice(0, 500) })
  if (EV.history.length > MAX_HISTORY_MSGS) {
    EV.history = EV.history.slice(-MAX_HISTORY_MSGS)
  }
  EV.count += 1

  // 流式半截：标记并跳过数据补写，避免残缺 JSON 误写
  const incomplete = !!res.incomplete
  if (incomplete) {
    EV.error = '（本轮输出不完整，剧情已保留，数据未写入）'
  }

  let changesBrief = null
  if (json && !incomplete) {
    if (Array.isArray(json.options) && json.options.length && !json.end) {
      EV.options = json.options.slice(0, 4).map(o => String(o).slice(0, 40))
    } else {
      EV.options = null
      EV.ended = true
    }
    if (json.end) EV.ended = true
    if (json.changes) {
      try {
        syncGiftsWithNarrative(json.changes, narrative)
        changesBrief = applyChanges(S, json.changes, hooks)
        EV.changesBrief = changesBrief
      } catch (e) {
        EV.error = '数据写入失败'
      }
      S.lastEventText = narrative
    } else if (giftMentioned(narrative)) {
      try {
        const ch = syncGiftsWithNarrative({}, narrative)
        changesBrief = applyChanges(S, ch, hooks)
        EV.changesBrief = changesBrief
      } catch (e) { /* ignore */ }
      S.lastEventText = narrative
    }
  } else if (!incomplete) {
    // 无 json：从正文补奖励，并尽量向模型要一次 json（recover 期间保持 loading，防并发）
    let recovered = null
    try {
      recovered = await recoverChangesFromLLM({ keyObj, narrative, S, signal: ctl.signal })
    } catch (e) { recovered = null }
    if (EV._turn !== turn) return // recover 期间被 endEvent/新回合作废
    if (EV.ended && EV._endedByUser) {
      EV.loading = false
      return
    }
    const ch = recovered || inferLite(narrative)
    if (ch && Object.keys(ch).length) {
      try {
        changesBrief = applyChanges(S, ch, hooks)
        EV.changesBrief = changesBrief
      } catch (e) { /* ignore */ }
    }
    const opts = parseOptionsFromText(narrative)
    if (opts.length) {
      EV.options = opts
      EV.ended = false
      EV.error = (recovered && Object.keys(recovered).length) || (ch && Object.keys(ch).length)
        ? '（本轮未附数据块，已按正文补写奖励）'
        : '（本轮未附数据块，剧情继续；可能少了奖励写入）'
      S.lastEventText = narrative
    } else if (ch && Object.keys(ch).length) {
      EV.options = null
      EV.ended = true
      EV.error = (recovered && Object.keys(recovered).length) || (ch && Object.keys(ch).length)
        ? '（本轮未附数据块，已按正文补写奖励）'
        : '（未解析到数据块，事件结束）'
      S.lastEventText = narrative
    } else {
      EV.options = null
      EV.ended = true
      EV.error = '（未解析到数据块，事件结束）'
    }
  } else {
    EV.options = null
    EV.ended = true
    S.lastEventText = narrative
  }

  EV.resultText = narrative
  EV.loading = false

  if (hooks.limitOn !== false && EV.count >= MAX_EVENT_CHOICES) {
    EV.ended = true
    EV.options = null
  }

  if (hooks.onDone) hooks.onDone(EV, changesBrief)
  if (hooks.onState) hooks.onState(EV)
}

export function endEvent(EV) {
  if (!EV) return
  EV._endedByUser = true
  EV.ended = true
  EV.loading = false
  if (EV._ctl) {
    try { EV._ctl.abort() } catch (e) { /* ignore */ }
    EV._ctl = null
  }
  EV._turn = (EV._turn || 0) + 1
  return null
}

function trimHistory(history) {
  const arr = Array.isArray(history) ? history : []
  return arr.slice(-MAX_HISTORY_MSGS)
}

function normalizeText(t) {
  if (t == null) return ''
  if (typeof t === 'string') return t
  if (Array.isArray(t)) {
    return t.map(p => (p && typeof p.text === 'string') ? p.text : (typeof p === 'string' ? p : '')).join('')
  }
  return String(t)
}

function stripJSONBlock(text) {
  let s = String(text || '')
    .replace(/```think[\s\S]*?```/gi, '')
    .replace(/```json[\s\S]*?```/gi, '')
    .replace(/```[\s\S]*?```/g, '')

  const dropLine = (t) => {
    if (/^(Let me|Keep it|I'll|I will|Actually|Maybe|Careful|Choice|Choices|Text|Wait|OK,|Sure,|Fine|Okay|First,|Then,|Based on|Start writing|Write a)\b/i.test(t)) return true
    if (/\bdesc\s*[:：]/i.test(t)) return true
    if (/^(我应|我述|我写|写吧|写完|根据|注意|不过|可以给|不需要|应该这样|玩家是|玩家要|玩家还|任务线索|选项[:：]|叙事|正文写|对话应该|规则说|不要随便|这把思考|给玩家|先给|让我|保持简洁|接近收束)/.test(t)) return true
    if (/^(用户|玩家|委托人|数值|金额|物品|地图|任务|关系|新增|应该|需要|必须|可以|最好|记得|确保|对齐|一致).{0,40}(交谈|递送|加|写|给|标|进|在|完成|推进|选择|选项)/.test(t)) return true
    if (/^(写|再写|补一).{0,20}(正文|一段|一百|100|字)/.test(t)) return true
    if (/^写正文[：:]/.test(t)) return true
    if (/也许.{0,30}(可以|引出)/.test(t) && !/[「」]/.test(t)) return true
    if (/引出新委托/.test(t) && !/[「」]/.test(t)) return true
    if (/^给个\s*[1-9]/.test(t)) return true
    if (/^JSON\s*要|new_locations|add_items|remove_items|money_main|changes\s*里/i.test(t)) return true
    if (/^\s*(数值|报酬|奖励|参数)\s*[:：]/.test(t)) return true
    return false
  }

  // 句首旁白剥离：「开始写。米拉接过…」→「米拉接过…」
  const stripPrefix = (t) => t
    .replace(/^[（(]?(?:开始写|写正文|写正文约\d+字|写约\d+字|开始|下面开始)[）)]?[。.，,、:：\s]+/u, '')
    .replace(/^JSON\s*要一致[。.，,、:：\s]+/u, '')

  const rawLines = s.split(/\r?\n/)
  const kept = []
  for (const line of rawLines) {
    let t = line.trim()
    if (!t) {
      if (kept.length) kept.push('')
      continue
    }
    t = stripPrefix(t)
    if (!t || dropLine(t)) continue
    kept.push(t)
  }

  let out = kept.join('\n').trim()
  const lines = out.split('\n')
  while (lines.length) {
    const head = lines[0].trim()
    if (!head) { lines.shift(); continue }
    if (/^[1-4][.．、)]\s*\S/.test(head)) break
    const looksStory = /[。！？」"”]/.test(head) && head.length >= 12 && !dropLine(head)
    if (looksStory) break
    lines.shift()
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function parseOptionsFromText(text) {
  const s = String(text || '')
  const out = []
  const re = /(?:^|\n)\s*([1-4])\s*[.．、)\]]\s*([^\n]{1,30})/g
  let m
  while ((m = re.exec(s))) {
    const t = m[2].trim()
    if (t && !out.includes(t)) out.push(t)
    if (out.length >= 4) break
  }
  return out
}

function resolveKey(S) {
  const keys = Array.isArray(S.playerKeys) ? S.playerKeys : []
  if (!keys.length) return null
  const idx = (typeof S.selectedKey === 'number' && keys[S.selectedKey]) ? S.selectedKey : 0
  return keys[idx] || keys[0] || null
}

function giftMentioned(text) {
  return /[「“][^」”]{1,20}[」”]/.test(String(text || '')) && /(塞|递|交|送|给|赠)/.test(String(text || ''))
}

/**
 * 无 json 补写：再问模型抽一次数据块；失败返回 null，上层回退 inferLite。
 * 必须自己实现，避免 ReferenceError 被 catch 吞掉后恒走 inferLite。
 */
export async function recoverChangesFromLLM({ keyObj, narrative, S, signal }) {
  if (!keyObj || !narrative || String(narrative).trim().length < 20) return null
  const money = (S && S.pack && S.pack.lexicon && S.pack.lexicon.money && S.pack.lexicon.money.main)
    || (S && S.lexicon && S.lexicon.money && S.lexicon.money.main)
    || '货币'
  const system = [
    '你是游戏数据抽取器。只输出一个 JSON 对象，不要任何解释或代码块围栏。',
    '根据用户给出的剧情正文，抽取确实发生的数据变化。',
    '字段约定（无则省略）：',
    '{"money_main":数字(正数表示获得),"add_items":[{"name":"物品名","count":1,"type":"special","desc":"来源"}],"progress":数字}',
    '不确定的不要编造。没有变化就输出 {}。'
  ].join('\n')
  const user = `货币单位是「${money}」。剧情正文：\n${String(narrative).slice(0, 3500)}`
  try {
    const res = await callLLM({
      keyObj,
      system,
      user,
      history: [],
      signal,
      maxTokens: 400
    })
    if (!res || !res.ok) return null
    const json = extractGameJSON(res.text)
    if (!json || typeof json !== 'object') return null
    const ch = json.changes && typeof json.changes === 'object' ? json.changes : json
    if (!ch || typeof ch !== 'object' || Array.isArray(ch)) return null
    // 只接受白名单字段，防止模型塞垃圾
    const out = {}
    if (Number(ch.money_main) > 0) out.money_main = Math.min(5000, Math.round(Number(ch.money_main)))
    if (ch.progress != null && Number.isFinite(Number(ch.progress)) && Number(ch.progress) !== 0) {
      out.progress = Math.round(Number(ch.progress))
    }
    if (Array.isArray(ch.add_items) && ch.add_items.length) {
      out.add_items = ch.add_items.slice(0, 8).map(it => ({
        name: String((it && it.name) || '').slice(0, 20),
        count: Math.max(1, Math.min(9, Number(it && it.count) || 1)),
        type: String((it && it.type) || 'special'),
        desc: String((it && it.desc) || '剧情所得').slice(0, 40)
      })).filter(it => it.name)
    }
    if (Array.isArray(ch.options) && ch.options.length) {
      out.options = ch.options.slice(0, 4).map(o => String(o).slice(0, 40)).filter(Boolean)
    }
    return Object.keys(out).length ? out : null
  } catch (e) {
    return null
  }
}

function inferLite(narrative) {
  const cnNum = (raw) => {
    if (/^\d+$/.test(raw)) return Number(raw)
    const map = { 一:1, 两:2, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 }
    if (raw === '十') return 10
    if (raw.startsWith('十')) return 10 + (map[raw[1]] || 0)
    if (raw.includes('十')) {
      const [a,b] = raw.split('十')
      return (map[a] || 0) * 10 + (map[b] || 0)
    }
    return Number(raw) || 0
  }
  const s = String(narrative || '')
  const ch = {}
  const cn = { 一:1, 两:2, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 十一:11, 十二:12, 十三:13, 十五:15, 二十:20, 三十:30, 五十:50, 一百:100, 两百:200, 一千:1000 }
  const re = /([0-9]+|十[一二三]?|[一二两三四五六七八九十百]+)\s*(枚|个)?\s*(银币|金币|铜钱|现金|灵石)/g
  let m
  let sum = 0
  while ((m = re.exec(s))) {
    const raw = m[1]
    const n = cnNum(raw)
    sum += n
    if (sum > 2000) { sum = 2000; break }
  }
  if (sum > 0) ch.money_main = sum
  try {
    const gifts = extractGiftNames(s)
    if (gifts.length) {
      ch.add_items = gifts.map(name => ({ name, count: 1, type: 'special', desc: '剧情所得' }))
    }
  } catch (e) { /* ignore */ }
  return ch
}
