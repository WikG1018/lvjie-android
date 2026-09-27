// 修仙世界观包
import { createXiuxianMap } from './map.js'
import { buildXiuxianRules } from './rules.js'

export const xiuxianPack = {
  id: 'xiuxian',
  name: '修仙',
  icon: '⛰️',
  tagline: '凡人到道祖，人界飞升仙界',
  gameTitle: 'Agent修仙',
  theme: {
    accent: '#e8c46a', accent2: '#b98a2f', accentDim: '#8a6d2a',
    glow: 'rgba(232,196,106,.35)',
    bg: '#070b16', bg2: '#0d1530', bg3: '#060a14',
    panel: 'rgba(18,28,54,.82)', panel2: 'rgba(28,44,80,.55)',
    line: 'rgba(140,160,220,.16)', line2: 'rgba(140,160,220,.3)',
    text: '#d9e1f4', dim: '#8b98b8', faint: '#5c6a8a',
    fontDisplay: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontBody: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontEvent: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    radius: '12px',
    cardBg: 'linear-gradient(165deg, rgba(30,40,80,.75), rgba(16,24,48,.85))'
  },
  defaultName: '无名散修',
  startText: '踏入修仙之路，成为天南大陆一名十岁的凡人。',
  features: { lifespan: true, levelPressure: true, marriage: true },
  ui: {
    advanceBtn: '🌟 突破',
    advanceVerb: '突破',
    advanceTo: '突破至',
    advancePeak: '已至大道尽头',
    advanceSuccessTitle: '突破成功',
    lifeWarn: '寿限将尽',
    talkBtn: '交谈',
    fightBtn: '挑战'
  },
  sceneActions: [
    { id: 'travel', label: '🧭 游历四方', prompt: '我离开此处，四处游历，增长见闻。' },
    { id: 'talk', label: '💬 与人交谈', prompt: '我想找道友聊聊天，打听消息。' },
    { id: 'fight', label: '⚔️ 除妖/挑战', prompt: '我向附近的妖兽或强者发起挑战！' },
    { id: 'search', label: '🔍 探索秘境', prompt: '我仔细探索此地，寻找机缘与宝物。' },
    { id: 'cultivate', label: '🧘 打坐修炼', prompt: '我寻一静处打坐修炼，稳固修为。' }
  ],
  worlds: ['人界', '灵界', '仙界'],
  worldMaxTier: { 人界: 4, 灵界: 8, 仙界: 13 },
  subNames: ['初期', '中期', '后期', '大圆满'],
  subPower: [1, 1.25, 1.6, 1.8],
  lexicon: {
    spouse: '道侣',
    propose: '结为道侣',
    divorce: '解除关系',
    level: '境界',
    progress: '修为',
    money: { main: '灵石', mid: '上品灵石', high: '仙元石' },
    companion: '道友',
    skill: '技艺',
    power: '战力',
    technique: '功法',
    startBtn: '开始修仙之旅',
    welcomeTitle: 'Agent修仙',
    welcomeSub: 'AI驱动的开放世界修仙之旅',
    nav: {
      quests: '委托',
      scene: '当前场景',
      map: '世界地图',
      profile: '人物信息',
      friends: '道友',
      bag: '背包',
      settings: '设置'
    }
  },
  skills: [
    { id: 'alchemy', name: '炼丹', prof: '炼丹师' },
    { id: 'forge', name: '炼器', prof: '炼器师' },
    { id: 'array', name: '阵法', prof: '阵法师' },
    { id: 'talisman', name: '符箓', prof: '制符师' }
  ],
  typeNames: {
    consumable: '丹药',
    equip: '法宝',
    technique: '功法',
    material: '灵材',
    special: '杂物'
  },
  talentNames: { vase: '神秘绿瓶', tianling: '天灵根', shuangxiu: '双修神体', mortal: '凡人之躯' },
  talentCultMul: (t) => (t === 'tianling' ? 0.5 : 1),
  breakthroughGrade: '突破丹',
  pillPct: { 下品: 5, 中品: 10, 上品: 20, 极品: 30 },
  pillPriceK: 20,
  artPriceK: 100,
  breakthroughPriceK: 25,
  artPower: { 下品: 0.1, 中品: 0.17, 上品: 0.3, 极品: 0.5 },
  cultYears: [2, 20, 80, 300, 900, 3000, 10000, 50000, 200000, 1000000, 5000000, 20000000, 100000000, 500000000],
  startLoc: 'l_qy',
  tiers: [
    { name: '凡人', lifespan: 100, subNames: ['初期', '中期', '后期'] },
    { name: '炼气', lifespan: 100 },
    { name: '筑基', lifespan: 200 },
    { name: '结丹', lifespan: 500 },
    { name: '元婴', lifespan: 1000 },
    { name: '化神', lifespan: 2500 },
    { name: '炼虚', lifespan: 10000 },
    { name: '合体', lifespan: 30000 },
    { name: '大乘', lifespan: 100000 },
    { name: '真仙', lifespan: 400000 },
    { name: '金仙', lifespan: 2000000 },
    { name: '太乙', lifespan: Infinity },
    { name: '大罗', lifespan: Infinity },
    { name: '道祖', lifespan: Infinity }
  ],
  createMap: createXiuxianMap,
  buildRules: buildXiuxianRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    const order = ['人界', '灵界', '仙界']
    const fi = order.indexOf(from.world)
    const ti = order.indexOf(to.world)
    if (fi >= 0 && ti >= 0 && ti > fi + 1) return '需逐界飞升，不可跳过世界'
    if (to.world === '灵界' && from.world === '人界') {
      if (S.tierIndex < 5) return '飞升灵界需化神后期'
      if (S.tierIndex === 5 && S.sub < 2) return '飞升灵界需化神后期'
    }
    if (to.world === '仙界' && from.world === '灵界') {
      if (S.tierIndex < 9) return '飞升仙界需真仙初期'
    }
    if (from.world === to.world && from.world === '人界' &&
        from.continent && to.continent && from.continent !== to.continent) {
      if (S.tierIndex < 4) return '人界跨大陆需元婴期'
    }
    return null
  },
  travelDays(S, c, t) {
    const speed = Math.pow(2, Math.max(0, S.tierIndex) - 1)
    const near = { 人界: 5, 灵界: 80, 仙界: 1280 }
    let raw = 5
    if (c.world !== t.world) {
      const order = ['人界', '灵界', '仙界']
      const a = order.indexOf(c.world)
      const b = order.indexOf(t.world)
      raw = 0
      for (let k = Math.min(a, b); k < Math.max(a, b); k++) {
        raw += [320, 10240][k] || 320
      }
    } else if (c.continent !== t.continent) {
      raw = 20
    } else {
      raw = near[t.world] || 5
    }
    return Math.max(0, Math.floor(raw / speed))
  },
  createInitState() {
    return {
      ageDays: 3600,
      money: { main: 0, mid: 0, high: 0 },
      tierIndex: 0,
      sub: 0,
      progress: 0,
      state: {},
      startInventory: [
        {
          name: '养气丹',
          desc: '炼气下品丹药，服用可增加少量修为',
          type: 'consumable',
          realm_index: 1,
          grade: '下品',
          price: 20,
          count: 2,
          usable: 'direct',
          use_effect: { type: 'progress', value: 1 }
        }
      ],
      startEvents: [
        { age: '10岁0月0天', text: '踏入修仙之路，成为天南大陆一名十岁的凡人。' }
      ]
    }
  }
}
