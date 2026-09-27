// 整本书 → 分片抽样 → 多次 LLM 提取 → 合并设定
import { callLLM, extractGameJSON } from './llm.js'

export const CHUNK_CHARS = 3600
export const MAX_SAMPLES = 10
export const MAX_BOOK_CHARS = 400_000

export const EXTRACT_CHUNK_PROMPT = `你是小说设定考据员。阅读下面这「一段」小说原文（可能来自开头/中段/结尾），只提取可核对的世界观事实，输出一个 JSON 代码块：

{
  "era": "时代/世界一句话",
  "power_system": ["力量体系关键词或等级名，从低到高"],
  "places": ["重要地名"],
  "factions": ["组织/宗门/势力"],
  "characters": [{ "name": "名", "role": "身份/定位" }],
  "items": ["重要物品/货币/法宝名"],
  "tone": "文风与题材一句",
  "notes": ["其它对游戏世界观有用的硬设定"]
}

要求：
- 用简体中文；不确定就少写，禁止编造原文没有的等级名
- power_system 尽量按文中出现的从弱到强排列
- 不要输出 JSON 以外内容`

export const MERGE_PROMPT = `你是开放世界游戏世界观架构师。根据下面多段小说摘录的考据 JSON（以及可选的联网补充材料），合并成一份「设定圣经」，供生成游戏世界包。

输出一个 \`\`\`json 代码块：
{
  "setting_bible": "800~1500字，综合时代、力量体系、主要势力、地理、主角常见处境、物品与货币",
  "power_ladder": ["从低到高 5~14 个等级名，统一命名"],
  "money": { "main": "主货币", "mid": "中货币", "high": "高货币" },
  "places_seed": [
    { "name": "地名", "world": "界/区域", "type": "类型", "desc": "一句", "why": "为何适合开局" }
  ],
  "companion_word": "同伴称呼",
  "advance_verb": "升级动词",
  "level_word": "等级称呼",
  "progress_word": "进度/经验称呼",
  "style_rules": ["正向句 5~10 条：题材边界、物品风格、事件类型、位阶写法"],
  "start_scenarios": ["2~4 个开局处境候选"]
}

要求：以原文考据为准，联网材料可补全等级/货币/地名等硬设定；等级命名前后统一；style_rules 只写正向描述。`

/** 粗切章节并抽样：头 / 中 / 尾覆盖成长线（全书三段，避免只取书头） */
export function sampleBookChunks(text) {
  const raw = String(text || '')
  const total = raw.length
  const segLen = Math.max(20000, Math.floor(total / 3))
  const segments = []
  if (total <= Math.max(MAX_BOOK_CHARS, segLen * 2 + 1000) && total <= 250000) {
    // 中短文本整本进段
    segments.push(raw)
  } else if (total <= MAX_BOOK_CHARS) {
    segments.push(raw)
  } else {
    segments.push(raw.slice(0, segLen))
    segments.push(raw.slice(Math.max(0, Math.floor(total / 2) - Math.floor(segLen / 2)), Math.floor(total / 2) + Math.floor(segLen / 2)))
    segments.push(raw.slice(Math.max(0, total - segLen)))
  }

  const samples = []
  for (const seg of segments) {
    const chapters = splitChapters(seg)
    if (chapters.length >= 4) {
      const idxSet = new Set()
      const n = chapters.length
      const step = Math.max(1, Math.floor(n / MAX_SAMPLES))
      for (let i = 0; i < n && idxSet.size < MAX_SAMPLES; i += step) idxSet.add(i)
      idxSet.add(0)
      idxSet.add(n - 1)
      idxSet.add(Math.floor(n / 2))
      for (const j of [...idxSet].sort((a, b) => a - b)) {
        if (samples.length >= MAX_SAMPLES) break
        samples.push(chapters[j].slice(0, CHUNK_CHARS))
      }
    } else {
      for (let i = 0; i < seg.length && samples.length < MAX_SAMPLES; i += CHUNK_CHARS) {
        samples.push(seg.slice(i, i + CHUNK_CHARS))
      }
    }
    if (samples.length >= MAX_SAMPLES) break
  }
  if (!samples.length) samples.push(raw.slice(0, CHUNK_CHARS))
  return {
    chapters: segments.reduce((n, s) => n + splitChapters(s).length, 0),
    samples: samples.slice(0, MAX_SAMPLES),
    totalChars: total
  }
}

export function splitChapters(text) {
  const lines = String(text || '').split(/\r?\n/)
  const marks = []
  const re = /^(第\s*[0-9０-９一二三四五六七八九十百千零两]+\s*[章回节卷幕]|序章|楔子|尾声|Chapter\s*\d+|CHAPTER\s*\d+)/
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i].trim())) marks.push(i)
  }
  if (marks.length < 4) {
    const out = []
    for (let i = 0; i < text.length; i += CHUNK_CHARS * 2) {
      out.push(text.slice(i, i + CHUNK_CHARS * 2))
    }
    return out
  }
  const out = []
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i]
    const end = i + 1 < marks.length ? marks[i + 1] : lines.length
    const block = lines.slice(start, end).join('\n')
    out.push(block.length > CHUNK_CHARS ? block.slice(0, CHUNK_CHARS) : block)
  }
  return out
}

export const CHAR_ROSTER_PROMPT = `你是小说设定考据员。从作品与下列材料中选出 8~15 位**适合在开放世界里当 NPC/同伴**的人物（主角、核心同伴、重要对手、势力领袖优先；龙套不要）。

输出一个 \`\`\`json 代码块：
{
  "characters": [
    {
      "name": "准确人名",
      "aliases": ["别名"],
      "role": "身份/定位",
      "tier_hint": "在力量体系中的大致档位或称号",
      "intro": "40~80字人设，适合贴进游戏 NPC 档案",
      "personality": "性格关键词",
      "faction": "所属势力或空",
      "spoiler_level": "无/轻微/涉及结局"
    }
  ]
}

要求：人名以原文为准；不要编造不存在的角色；用简体中文；只输出 JSON。`

export const CHAR_CARD_PROMPT = `你是游戏角色档案撰写者。根据作品设定与角色考据材料，把人物整理成可直接放入游戏地图的 NPC 种子列表。

输出一个 \`\`\`json 代码块：
{
  "npc_seeds": [
    {
      "name": "人名",
      "realm": "档位/称号（贴合世界等级表）",
      "power": 10,
      "intro": "30~60字档案",
      "gender": "男/女/空",
      "home": "适合出现的地点类型，例如 酒馆/学院/王城",
      "is_companion": true
    }
  ]
}

要求：
- 8~12 人；power 用 1~200 的相对战力，与档位匹配
- intro 只写身份与性格，不写结局剧透
- home 要能落到地图 people 节点
- 只输出 JSON`

function safeJSON(text) {
  return extractGameJSON(text)
}

/** 从多段考据 + 设定圣经里抽出人名候选 */
export function collectCharacterNames(facts, bible, limit = 16) {
  const out = []
  const seen = new Set()
  const push = (n) => {
    const name = String(n || '').trim()
    if (!name || name.length < 2 || name.length > 12) return
    if (/[的地得了吧呢啊呀]/.test(name) && name.length > 6) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    out.push(name)
  }
  for (const f of facts || []) {
    for (const c of f.characters || []) {
      push(typeof c === 'string' ? c : (c && c.name))
    }
  }
  if (bible && Array.isArray(bible.characters)) {
    for (const c of bible.characters) push(typeof c === 'string' ? c : (c && c.name))
  }
  // 文本里常见的「XX说」不太可靠，只靠结构化字段
  return out.slice(0, limit)
}

/**
 * 选角 + 联网角色条目 + 写 NPC 种子
 * @returns {Promise<{ok, roster?, npc_seeds?, error?}>}
 */
export async function buildCharacterSeeds({
  keyObj,
  title,
  facts,
  bible,
  samples,
  signal,
  onProgress,
  useWeb,
  fetchCharacterLore
}) {
  const report = onProgress || (() => {})
  report({ message: '筛选主要人物…' })
  const rosterRes = await callLLM({
    keyObj,
    system: CHAR_ROSTER_PROMPT,
    user: `作品：${title}\n设定摘要：${(bible && bible.setting_bible) || ''}\n考据片段：\n` +
      JSON.stringify((facts || []).slice(0, 12)) +
      (samples && samples[0] ? `\n原文开头摘录：\n${String(samples[0]).slice(0, 2500)}` : ''),
    signal
  })
  if (!rosterRes.ok) return { ok: false, error: rosterRes.error || '选角失败', aborted: rosterRes.aborted }
  const rosterJson = safeJSON(rosterRes.text) || {}
  let roster = Array.isArray(rosterJson.characters) ? rosterJson.characters : []
  if (!roster.length) {
    roster = collectCharacterNames(facts, bible).map(name => ({ name, role: '角色', intro: '' }))
  }
  roster = roster.slice(0, 12)

  const charNotes = []
  if (useWeb && fetchCharacterLore) {
    const targets = roster.slice(0, 4) // 控制联网次数
    const jobs = targets.map(async (c, i) => {
      report({ message: `查角色条目 ${i + 1}/${targets.length}：${c.name}…` })
      try {
        const r = await fetchCharacterLore(c.name, title)
        return r.ok && r.notes ? r.notes : []
      } catch (e) {
        return []
      }
    })
    const groups = await Promise.all(jobs)
    for (const g of groups) {
      for (const n of g) charNotes.push({ ...n })
    }
  }

  report({ message: '生成 NPC 档案…' })
  const cardRes = await callLLM({
    keyObj,
    system: CHAR_CARD_PROMPT,
    user: `作品：${title}\n等级体系：${((bible && bible.power_ladder) || []).join('、')}\n角色名单：\n` +
      JSON.stringify(roster) +
      `\n角色百科/原文考据：\n` + JSON.stringify(charNotes.slice(0, 12)) +
      `\n设定圣经：${(bible && bible.setting_bible) || ''}`,
    signal
  })
  if (!cardRes.ok) return { ok: false, error: cardRes.error || 'NPC 档案失败', aborted: cardRes.aborted }
  const cardJson = safeJSON(cardRes.text) || {}
  const npc_seeds = Array.isArray(cardJson.npc_seeds) ? cardJson.npc_seeds.slice(0, 12) : []
  if (!npc_seeds.length) {
    return { ok: false, error: '未能生成 NPC 种子' }
  }
  return { ok: true, roster, npc_seeds, charNotes }
}

/** 把 NPC 种子压进生成世界包的用户消息 */
export function npcSeedsToBrief(npcSeeds) {
  const list = Array.isArray(npcSeeds) ? npc_seedsSafe(npcSeeds) : []
  if (!list.length) return ''
  return `\n地图 people 必须尽量收入以下人物（可按地点分布，home 只是建议）：\n` +
    JSON.stringify(list.map(n => ({
      name: n.name,
      realm: n.realm,
      power: n.power,
      intro: n.intro,
      gender: n.gender,
      home: n.home,
      companion: !!n.is_companion
    })), null, 2)
}

function npc_seedsSafe(list) {
  return list.filter(x => x && x.name).map(x => ({
    name: String(x.name).slice(0, 24),
    realm: String(x.realm || x.tier_hint || '').slice(0, 24),
    power: Number(x.power) || 10,
    intro: String(x.intro || x.role || '').slice(0, 120),
    gender: x.gender === '男' || x.gender === '女' ? x.gender : '',
    home: String(x.home || '主城').slice(0, 24),
    is_companion: !!x.is_companion
  }))
}

/**
 * 整本书提取。onProgress({ step, total, message })
 * @param {object} opt
 * @param {Array} opt.webNotes - 联网补充材料 [{kind,source,text}]
 * @returns {Promise<{ok, bible?, error?, partial?}>}
 */
export async function extractBookFacts({ keyObj, title, author, samples, signal, onProgress, webNotes }) {
  const report = onProgress || (() => {})
  const facts = []
  for (let i = 0; i < samples.length; i++) {
    report({ step: i + 1, total: samples.length + 1, message: `考据原文 ${i + 1}/${samples.length}…` })
    const res = await callLLM({
      keyObj,
      system: EXTRACT_CHUNK_PROMPT,
      user: `作品：${title}${author ? '（' + author + '）' : ''}\n\n片段 ${i + 1}/${samples.length}：\n${samples[i]}`,
      signal
    })
    if (!res.ok) {
      if (res.aborted) return { ok: false, error: '已取消', aborted: true }
      continue
    }
    const j = safeJSON(res.text)
    if (j) facts.push(j)
  }
  if (!facts.length && !(webNotes && webNotes.length)) {
    return { ok: false, error: '未能从原文提取出设定（可减少文本量或检查 API）' }
  }

  report({ step: samples.length + 1, total: samples.length + 1, message: '合并设定圣经…' })
  let webBlock = ''
  if (webNotes && webNotes.length) {
    // 动态 import 会环依赖，这里内联简单拼接
    webBlock = webNotes.map((n, i) => {
      const head = n.kind === 'wiki' ? '维基/百科' : '设定页'
      return `【补充${i + 1}·${head}】${n.source || ''}\n${String(n.text || '').slice(0, 8000)}`
    }).join('\n\n')
  }
  const merge = await callLLM({
    keyObj,
    system: MERGE_PROMPT,
    user: `作品：${title}${author ? '（' + author + '）' : ''}\n多段考据 JSON：\n` + JSON.stringify(facts) +
      (webBlock ? `\n\n联网补充材料（优先与原文一致，可补全未抽到的设定）：\n${webBlock}` : ''),
    signal
  })
  if (!merge.ok) return { ok: false, error: merge.error || '合并失败', aborted: merge.aborted }
  const bible = safeJSON(merge.text)
  if (!bible || !bible.setting_bible) return { ok: false, error: '合并结果不完整' }
  return { ok: true, bible, facts }
}

/** 仅有联网材料时也可直接合并 */
export async function mergeWebOnly({ keyObj, title, author, webNotes, signal, onProgress }) {
  return extractBookFacts({ keyObj, title, author, samples: [], signal, onProgress, webNotes })
}

/** 设定圣经 → 喂给世界包草稿 prompt 的用户消息 */
export function bibleToUserBrief(title, author, bible) {
  const b = bible || {}
  return `作品：${title}${author ? '（' + author + '）' : ''}
以下是从原文提取并合并的设定圣经，请严格据此生成世界包 JSON：

${b.setting_bible || ''}

力量等级（从低到高）：${(b.power_ladder || []).join('、')}
货币：${JSON.stringify(b.money || {})}
等级称呼：${b.level_word || '等级'}；进度称呼：${b.progress_word || '进度'}；升级动词：${b.advance_verb || '晋阶'}；同伴称呼：${b.companion_word || '同伴'}
开局地点种子：
${JSON.stringify(b.places_seed || [], null, 2)}
风格铁律（正向）：
${(b.style_rules || []).map(r => '- ' + r).join('\n')}
开局处境候选：${(b.start_scenarios || []).join(' / ')}
`
}
