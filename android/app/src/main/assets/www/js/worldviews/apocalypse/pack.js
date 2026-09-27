// 末世世界观
import { createApocalypseMap } from './map.js'
import { buildApocalypseRules } from './rules.js'

export const apocalypsePack = {
  id: 'apocalypse',
  name: '末世',
  icon: '☢️',
  tagline: '灾变纪元，从幸存者到人类灯塔',
  gameTitle: 'Agent末世',
  theme: {
    accent: '#8fd66a', accent2: '#4a8a30', accentDim: '#3d6e28',
    glow: 'rgba(143,214,106,.3)',
    bg: '#0c1208', bg2: '#152010', bg3: '#080c06',
    panel: 'rgba(22,32,16,.84)', panel2: 'rgba(34,48,22,.55)',
    line: 'rgba(143,214,106,.14)', line2: 'rgba(143,214,106,.3)',
    text: '#c8e6b0', dim: '#8aaa70', faint: '#5a7040',
    jade: '#8fd66a', blue: '#6ab0c8', red: '#e06c4c', purple: '#a0c060',
    fontDisplay: '"Consolas","Microsoft YaHei",monospace',
    fontBody: '"Consolas","Microsoft YaHei",monospace',
    fontEvent: '"Consolas","Microsoft YaHei",monospace',
    radius: '2px',
    deco: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(143,214,106,.015) 2px, rgba(143,214,106,.015) 4px)',
    cardBg: 'rgba(28,40,18,.8)'
  },
  defaultName: '幸存者',
  startText: '红雾降临第七天，你从废墟里爬出来，手里只剩半瓶水。',
  features: { lifespan: false, levelPressure: true, marriage: false },
  ui: {
    advanceBtn: '☢️ 进化',
    advanceVerb: '进化',
    advanceTo: '进化至',
    advancePeak: '已至进化尽头',
    advanceSuccessTitle: '进化成功',
    lifeWarn: '状态危急',
    talkBtn: '交谈',
    fightBtn: '狩猎'
  },
  sceneActions: [
    { id: 'travel', label: '🚧 搜集转移', prompt: '我外出搜集物资并转移阵地。' },
    { id: 'talk', label: '📻 联络同伴', prompt: '我用无线电联络附近幸存者。' },
    { id: 'fight', label: '🪖 狩猎异变体', prompt: '我主动狩猎附近异变体！' },
    { id: 'search', label: '🎒 搜刮废墟', prompt: '我搜刮废墟，找食物药品与装备。' },
    { id: 'rest', label: '🛏️ 休整守夜', prompt: '我找掩体休整守夜，恢复体力。' }
  ],
  worlds: ['安全区', '荒野', '禁区'],
  worldMaxTier: { 安全区: 4, 荒野: 7, 禁区: 10 },
  subNames: ['初期', '中期', '后期', '巅峰'],
  subPower: [1, 1.3, 1.7, 2.1],
  lexicon: {
    spouse: '伴侣',
    propose: '结为伴侣',
    divorce: '解除关系',
    level: '进化等阶',
    progress: '进化点',
    money: { main: '物资点', mid: '信用点', high: '核心币' },
    companion: '同伴',
    skill: '生存技能',
    power: '战力',
    technique: '觉醒技',
    startBtn: '开始求生',
    welcomeTitle: 'Agent末世',
    welcomeSub: 'AI驱动的开放世界末世之旅',
    nav: {
      quests: '委托',
      scene: '当前位置', map: '废土地图', profile: '幸存者档案',
      friends: '同伴', bag: '物资', settings: '设置'
    }
  },
  skills: [
    { id: 'medic', name: '医疗', prof: '医师' },
    { id: 'mechanic', name: '机械', prof: '机修师' },
    { id: 'survive', name: '野外', prof: '生存专家' },
    { id: 'hack', name: '骇入', prof: '骇客' }
  ],
  typeNames: {
    consumable: '补给', equip: '装具', technique: '觉醒技',
    material: '材料', special: '钥匙/情报'
  },
  talentNames: { mutant: '变异体质', focus: '绝对专注', leader: '领袖气场', ordinary: '普通幸存者' },
  talentCultMul: (t) => (t === 'focus' ? 0.5 : 1),
  breakthroughGrade: '进化催化剂',
  pillPct: { 破损: 4, 标准: 8, 军规: 16, 稀有: 28 },
  pillPriceK: 16,
  artPriceK: 90,
  breakthroughPriceK: 24,
  artPower: { 破损: 0.1, 标准: 0.18, 军规: 0.32, 稀有: 0.55 },
  cultYears: [1, 10, 40, 120, 400, 1500, 5000, 20000, 80000, 300000],
  startLoc: 'a_shelter',
  tiers: [
    { name: '未觉醒', lifespan: 50, subNames: ['初期', '中期', '后期', '巅峰'] },
    { name: '一阶觉醒', lifespan: 60 },
    { name: '二阶觉醒', lifespan: 70 },
    { name: '三阶觉醒', lifespan: 90 },
    { name: '四阶觉醒', lifespan: 120 },
    { name: '五阶觉醒', lifespan: 160 },
    { name: '六阶觉醒', lifespan: 220 },
    { name: '七阶觉醒', lifespan: 300 },
    { name: '八阶觉醒', lifespan: 500 },
    { name: '九阶·灯塔', lifespan: 1000 },
    { name: '超阶·方舟', lifespan: Infinity }
  ],
  createMap: createApocalypseMap,
  buildRules: buildApocalypseRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    if (to.world === '荒野' && S.tierIndex < 1) return '未觉醒者进入荒野必死'
    if (to.world === '禁区' && S.tierIndex < 5) return '禁区需五阶以上战力'
    return null
  },
  travelDays(S, c, t) {
    const speed = Math.pow(1.5, Math.max(0, S.tierIndex))
    let raw = 3
    if (c.world !== t.world) raw = 90
    else if (c.continent !== t.continent) raw = 30
    return Math.max(0, Math.floor(raw / speed))
  },
  createInitState() {
    return {
      ageDays: 20 * 360,
      startInventory: [
        { name: '半瓶水', desc: '珍贵的饮用水', type: 'consumable', realm_index: 0, grade: '破损', price: 2, count: 1, usable: 'direct', use_effect: { type: 'progress', value: 0.3 } },
        { name: '生锈小刀', desc: '还能用的近战武器', type: 'equip', realm_index: 0, grade: '破损', price: 10, count: 1 }
      ],
      startEvents: [{ age: '20岁0月0天', text: '红雾灾变后的第七天，你成为了幸存者。' }]
    }
  }
}
