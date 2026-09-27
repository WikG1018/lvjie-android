// 声明式世界包 → 运行时 pack
// 自定义包为纯数据（可 JSON 导入/LLM 生成）；内置包仍为 JS 函数式

const DEFAULT_THEME = {
  accent: '#7aa2c8',
  accent2: '#4a6d8a',
  accentDim: '#3a5570',
  glow: 'rgba(122,162,200,.3)',
  bg: '#0a1020',
  bg2: '#101830',
  bg3: '#070c18',
  panel: 'rgba(18,28,54,.82)',
  panel2: 'rgba(28,44,80,.55)',
  line: 'rgba(140,160,220,.16)',
  line2: 'rgba(140,160,220,.3)',
  text: '#d9e1f4',
  dim: '#8b98b8',
  faint: '#5c6a8a',
  jade: '#8fbc8f',
  blue: '#8fa8c8',
  red: '#c87a6a',
  purple: '#b8a0c8',
  fontDisplay: '"STKaiti","KaiTi","Noto Serif SC",serif',
  fontBody: '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
  fontEvent: '"STKaiti","KaiTi","Noto Serif SC",serif',
  radius: '10px',
  cardBg: 'rgba(20,32,64,.78)'
}

const DEFAULT_TYPE_NAMES = {
  consumable: '消耗品',
  equip: '装备',
  technique: '秘籍',
  material: '材料',
  special: '特殊'
}

export const PACK_DRAFT_PROMPT = `你是开放世界文字游戏的世界观架构师。根据用户提供的作品设定，输出一份可导入游戏的「世界包」JSON。

只输出一个 \`\`\`json 代码块，不要其它解释。JSON 字段如下（全部用中文内容）：
{
  "id": "英文短横线小写，唯一",
  "name": "显示名（2-6字）",
  "icon": "一个 emoji",
  "tagline": "一句话卖点",
  "gameTitle": "游戏中展示的书名/世界名",
  "defaultName": "默认主角名",
  "startText": "开局叙事一句",
  "features": { "lifespan": true, "levelPressure": true, "marriage": false },
  "ui": {
    "advanceBtn": "升级按钮文案",
    "advanceVerb": "升级动词",
    "advanceTo": "升到",
    "advancePeak": "满级文案",
    "advanceSuccessTitle": "升级成功标题",
    "lifeWarn": "寿限警告",
    "talkBtn": "交谈",
    "fightBtn": "挑战"
  },
  "sceneActions": [
    { "id": "travel", "label": "🗺️ 行动名", "prompt": "玩家句柄" },
    { "id": "talk", "label": "💬 行动名", "prompt": "…" },
    { "id": "fight", "label": "⚔️ 行动名", "prompt": "…" },
    { "id": "search", "label": "🔍 行动名", "prompt": "…" },
    { "id": "rest", "label": "🧘 行动名", "prompt": "…" }
  ],
  "worlds": ["区域/界层名", "…"],
  "worldMaxTier": { "区域名": 数字 },
  "subNames": ["初期", "中期", "后期"],
  "subPower": [1, 1.25, 1.6],
  "lexicon": {
    "level": "等级名",
    "progress": "进度名",
    "money": { "main": "主货币", "mid": "中货币", "high": "高货币" },
    "companion": "同伴称呼",
    "skill": "技艺",
    "power": "战力名",
    "technique": "秘籍名",
    "startBtn": "开始按钮",
    "nav": { "scene": "场景", "map": "地图", "profile": "人物", "friends": "同伴", "bag": "行囊", "settings": "设置" }
  },
  "skills": [ { "id": "skill1", "name": "技艺名", "prof": "称号" } ],
  "typeNames": { "consumable": "…", "equip": "…", "technique": "…", "material": "…", "special": "…" },
  "tiers": [ { "name": "等级1", "lifespan": 100 }, { "name": "等级2", "lifespan": 200 } ],
  "startLoc": "m1",
  "map": [
    {
      "id": "m1",
      "name": "地点名",
      "world": "对应 worlds[0]",
      "continent": "区域",
      "type": "城池/荒野/…",
      "desc": "一句场景描述",
      "people": [ { "name": "人名", "realm": "等级", "power": 10, "intro": "…", "gender": "男" } ],
      "shop": [ { "name": "物名", "desc": "…", "type": "consumable", "realm_index": 0, "grade": "凡品", "price": 10, "usable": "direct", "use_effect": { "type": "progress", "value": 1 } } ],
      "beasts": [ { "name": "敌人", "realm": "等级", "power": 8, "drops": "掉落说明" } ],
      "interactables": [ { "name": "可交互", "intro": "…" } ]
    }
  ],
  "rules": "用正向句写 6~12 条该世界铁律：题材边界、升级动词、物品风格、事件类型、位阶差序写法。避免「不要写X」句式。",
  "worldOrder": ["worlds 的顺序，用于跨区门槛"],
  "worldTierReq": { "区域名": 0 },
  "init": { "ageDays": 3600, "money": { "main": 0, "mid": 0, "high": 0 }, "tierIndex": 0, "sub": 0, "progress": 0 }
}

硬性要求：
- tiers 至少 5 个，从低到高；subNames 2~4 个
- map 至少 2 个地点，startLoc 指向其中一个 id；world 字段必须属于 worlds
- 若给出了人物/NPC 种子，必须尽量原名收入各 map.people，并填 realm/power/intro
- rules 只写正向描述
- 全部文案用该作品语感；不要输出 JSON 以外内容`

/** 校验声明式包草稿；返回 { ok, errors, pack } */
export function validatePackDraft(raw) {
  const errors = []
  const d = raw && typeof raw === 'object' ? raw : null
  if (!d) return { ok: false, errors: ['不是对象'], pack: null }

  const id = String(d.id || '').trim().replace(/[^a-z0-9_-]/gi, '').toLowerCase()
  if (!id) errors.push('缺少 id')
  if (!d.name) errors.push('缺少 name')
  if (!Array.isArray(d.tiers) || d.tiers.length < 3) errors.push('tiers 至少 3 个')
  if (!Array.isArray(d.map) || d.map.length < 1) errors.push('map 至少 1 个地点')
  if (!d.lexicon || typeof d.lexicon !== 'object') errors.push('缺少 lexicon')
  else {
    if (!d.lexicon.level) errors.push('lexicon.level 必填')
    if (!d.lexicon.progress) errors.push('lexicon.progress 必填')
    if (!d.lexicon.money || typeof d.lexicon.money !== 'object') errors.push('lexicon.money 必填')
  }

  const map = Array.isArray(d.map) ? d.map.map((l, i) => normalizeLoc(l, i, d)) : []
  const seenIds = new Set()
  for (const l of map) {
    if (seenIds.has(l.id)) l.id = l.id + '_' + seenIds.size
    seenIds.add(l.id)
  }
  const startLoc = d.startLoc && map.some(l => l.id === d.startLoc)
    ? d.startLoc
    : (map[0] && map[0].id) || null
  if (!startLoc) errors.push('无法确定 startLoc')

  const worlds = Array.isArray(d.worlds) && d.worlds.length
    ? d.worlds.map(String)
    : Array.from(new Set(map.map(l => l.world))).filter(Boolean)
  if (!worlds.length) errors.push('缺少 worlds')

  const pack = {
    id: id || 'custom',
    name: String(d.name || '自定义世界'),
    icon: String(d.icon || '🌍'),
    tagline: String(d.tagline || '自定义世界观'),
    gameTitle: String(d.gameTitle || d.name || '自定义世界'),
    theme: Object.assign({}, DEFAULT_THEME, d.theme || {}),
    defaultName: String(d.defaultName || '旅人'),
    startText: String(d.startText || '故事开始了。'),
    features: Object.assign({
      lifespan: true,
      levelPressure: true,
      marriage: false
    }, d.features || {}),
    ui: Object.assign({
      advanceBtn: '晋阶',
      advanceVerb: '晋阶',
      advanceTo: '晋阶至',
      advancePeak: '已至尽头',
      advanceSuccessTitle: '晋阶成功',
      lifeWarn: '时日无多',
      talkBtn: '交谈',
      fightBtn: '挑战'
    }, d.ui || {}),
    sceneActions: normalizeActions(d.sceneActions),
    worlds,
    worldMaxTier: d.worldMaxTier && typeof d.worldMaxTier === 'object' ? d.worldMaxTier : {},
    subNames: Array.isArray(d.subNames) && d.subNames.length ? d.subNames.map(String) : ['初期', '中期', '后期'],
    subPower: Array.isArray(d.subPower) && d.subPower.length ? d.subPower.map(Number) : [1, 1.25, 1.6],
    lexicon: normalizeLexicon(d.lexicon),
    skills: Array.isArray(d.skills) ? d.skills.map((s, i) => ({
      id: String(s.id || 'sk' + i),
      name: String(s.name || s.id || '技艺' + i),
      prof: String(s.prof || s.name || '')
    })) : [],
    typeNames: Object.assign({}, DEFAULT_TYPE_NAMES, d.typeNames || {}),
    talentNames: d.talentNames || {},
    tiers: (d.tiers || []).map(t => ({
      name: String(t.name || '?'),
      lifespan: t.lifespan === 'Infinity' || t.lifespan === Infinity ? Infinity : (t.lifespan != null ? Number(t.lifespan) : 100),
      subNames: Array.isArray(t.subNames) ? t.subNames.map(String) : null
    })),
    startLoc,
    _decl: {
      map,
      rules: normalizeRules(d.rules),
      worldOrder: Array.isArray(d.worldOrder) && d.worldOrder.length ? d.worldOrder.map(String) : worlds,
      worldTierReq: d.worldTierReq && typeof d.worldTierReq === 'object' ? d.worldTierReq : {},
      init: d.init && typeof d.init === 'object' ? d.init : null
    },
    createMap: () => JSON.parse(JSON.stringify(map)),
    buildRules: () => normalizeRules(d.rules),
    gateRules(from, to) {
      const order = (d.worldOrder && d.worldOrder.length ? d.worldOrder.map(String) : worlds)
      const req = (d.worldTierReq && typeof d.worldTierReq === 'object') ? d.worldTierReq : {}
      if (!from || !from.world || !to || !to.world) return null
      if (from.world === to.world) return null
      const fi = order.indexOf(from.world)
      const ti = order.indexOf(to.world)
      if (fi >= 0 && ti >= 0 && ti > fi + 1) return '需逐级前往相邻区域'
      const need = Number(req[to.world])
      if (Number.isFinite(need) && need > 0) {
        // 传入的 S 在 gateRules(from,to,S) 第三参；此处用闭包外的调用方
      }
      return null
    }
  }

  // 真正读 S 的门槛（覆盖上面占位）
  pack.gateRules = function (from, to, S) {
    const order = (d.worldOrder && d.worldOrder.length ? d.worldOrder.map(String) : worlds)
    const req = (d.worldTierReq && typeof d.worldTierReq === 'object') ? d.worldTierReq : {}
    if (!from || !to || from.world === to.world) return null
    const fi = order.indexOf(from.world)
    const ti = order.indexOf(to.world)
    if (fi >= 0 && ti >= 0 && ti > fi + 1) return '需逐级前往相邻区域'
    const need = Number(req[to.world])
    if (Number.isFinite(need) && need > 0 && S && (S.tierIndex || 0) < need) {
      const tn = pack.tiers[need] && pack.tiers[need].name
      return `进入${to.world}需达到${tn || '更高' + pack.lexicon.level}`
    }
    return null
  }

  if (d.init && typeof d.init === 'object') {
    const initRaw = d.init
    pack.createInitState = () => ({
      ageDays: initRaw.ageDays != null ? Number(initRaw.ageDays) : 3600,
      money: {
        main: Number((initRaw.money && initRaw.money.main) || 0),
        mid: Number((initRaw.money && initRaw.money.mid) || 0),
        high: Number((initRaw.money && initRaw.money.high) || 0)
      },
      tierIndex: Number(initRaw.tierIndex) || 0,
      sub: Number(initRaw.sub) || 0,
      progress: Number(initRaw.progress) || 0
    })
  }

  return { ok: errors.length === 0, errors, pack: errors.length ? null : pack }
}

function normalizeLoc(l, i, d) {
  const worlds = Array.isArray(d.worlds) && d.worlds.length ? d.worlds.map(String) : []
  const world = String(l.world || worlds[0] || '主世界')
  return {
    id: String(l.id || 'm' + (i + 1)),
    name: String(l.name || '未命名之地'),
    world: worlds.length && !worlds.includes(world) ? worlds[0] : world,
    continent: String(l.continent || '主区域'),
    type: String(l.type || '荒野'),
    desc: String(l.desc || ''),
    people: Array.isArray(l.people) ? l.people.map(p => ({
      name: String(p.name || '无名氏'),
      realm: String(p.realm || ''),
      power: Number(p.power) || 0,
      intro: String(p.intro || ''),
      gender: p.gender === '男' || p.gender === '女' ? p.gender : ''
    })) : [],
    shop: Array.isArray(l.shop) ? l.shop.map(s => ({
      name: String(s.name || '物品'),
      desc: String(s.desc || ''),
      type: s.type || 'special',
      realm_index: s.realm_index != null ? Number(s.realm_index) : undefined,
      grade: s.grade != null ? String(s.grade) : undefined,
      price: Math.max(0, Number(s.price) || 0),
      usable: s.usable || undefined,
      use_effect: s.use_effect && typeof s.use_effect === 'object' && s.use_effect.type
        ? {
            type: String(s.use_effect.type).slice(0, 24),
            value: Number(s.use_effect.value) || 0
          }
        : undefined
    })) : [],
    beasts: Array.isArray(l.beasts) ? l.beasts.map(b => ({
      name: String(b.name || '生物'),
      realm: String(b.realm || ''),
      power: Number(b.power) || 0,
      drops: String(b.drops || '')
    })) : [],
    interactables: Array.isArray(l.interactables) ? l.interactables.map(x => ({
      name: String(x.name || '物件'),
      intro: String(x.intro || '')
    })) : [],
    notes: Array.isArray(l.notes) ? l.notes.map(String) : []
  }
}

function normalizeActions(list) {
  const defs = [
    { id: 'travel', label: '🗺️ 外出', prompt: '我离开此处，去附近走动。' },
    { id: 'talk', label: '💬 交谈', prompt: '我想找人聊聊，打听消息。' },
    { id: 'fight', label: '⚔️ 挑战', challenge: true, prompt: '我向附近较强的对手发起挑战！' },
    { id: 'search', label: '🔍 探索', prompt: '我仔细探索此地，寻找机会与收获。' },
    { id: 'rest', label: '🧘 休整', prompt: '我找地方休整片刻。' }
  ]
  if (!Array.isArray(list) || !list.length) return defs
  return list.slice(0, 6).map((a, i) => ({
    id: String(a.id || 'act' + i),
    label: String(a.label || '行动'),
    prompt: String(a.prompt || a.label || '我继续行动。')
  }))
}

function normalizeLexicon(lex) {
  const l = lex || {}
  return {
    level: String(l.level || '等级'),
    progress: String(l.progress || '进度'),
    money: {
      main: String((l.money && l.money.main) || '金币'),
      mid: String((l.money && l.money.mid) || '银币'),
      high: String((l.money && l.money.high) || '魔晶')
    },
    companion: String(l.companion || '同伴'),
    skill: String(l.skill || '技艺'),
    power: String(l.power || '战力'),
    technique: String(l.technique || '秘籍'),
    startBtn: String(l.startBtn || '进入世界'),
    welcomeTitle: String(l.welcomeTitle || l.level || '启程'),
    welcomeSub: String(l.welcomeSub || ''),
    nav: Object.assign({
      scene: '场景', map: '地图', profile: '人物', friends: '同伴', bag: '行囊', settings: '设置'
    }, l.nav || {})
  }
}

function normalizeRules(rules) {
  if (Array.isArray(rules)) return rules.map(r => String(r).trim()).filter(Boolean).map(r => r.startsWith('-') ? r : '- ' + r).join('\n')
  return String(rules || '遵守本世界设定，保持题材自洽。')
}

/** 供导出：只保留声明字段 */
export function packToDraft(pack) {
  if (!pack) return null
  if (pack._decl) {
    return {
      schemaVersion: 1,
      id: pack.id,
      name: pack.name,
      icon: pack.icon,
      tagline: pack.tagline,
      gameTitle: pack.gameTitle,
      defaultName: pack.defaultName,
      startText: pack.startText,
      features: pack.features,
      ui: pack.ui,
      sceneActions: pack.sceneActions,
      worlds: pack.worlds,
      worldMaxTier: pack.worldMaxTier,
      subNames: pack.subNames,
      subPower: pack.subPower,
      lexicon: pack.lexicon,
      skills: pack.skills,
      typeNames: pack.typeNames,
      tiers: pack.tiers.map(t => ({ name: t.name, lifespan: t.lifespan === Infinity ? 'Infinity' : t.lifespan, subNames: t.subNames })),
      startLoc: pack.startLoc,
      map: pack._decl.map,
      rules: pack._decl.rules,
      worldOrder: pack._decl.worldOrder,
      worldTierReq: pack._decl.worldTierReq,
      init: pack._decl.init
    }
  }
  // 内置包：尽量导出可复用字段（无 createMap 静态 map 时 map 为空）
  return {
    schemaVersion: 1,
    id: pack.id,
    name: pack.name,
    icon: pack.icon,
    tagline: pack.tagline,
    gameTitle: pack.gameTitle,
    defaultName: pack.defaultName,
    startText: pack.startText,
    features: pack.features,
    ui: pack.ui,
    sceneActions: pack.sceneActions,
    worlds: pack.worlds,
    worldMaxTier: pack.worldMaxTier,
    subNames: pack.subNames,
    subPower: pack.subPower,
    lexicon: pack.lexicon,
    skills: pack.skills,
    typeNames: pack.typeNames,
    tiers: pack.tiers.map(t => ({ name: t.name, lifespan: t.lifespan === Infinity ? 'Infinity' : t.lifespan })),
    startLoc: pack.startLoc,
    map: pack.createMap ? pack.createMap() : [],
    rules: pack.buildRules ? pack.buildRules({ cheatOn: false }) : '',
    note: '由内置包导出；gate/精细逻辑可能丢失'
  }
}
