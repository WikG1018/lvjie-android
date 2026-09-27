// 职场 / 商战世界观（原「都市」）
import { createUrbanMap } from './map.js'
import { buildUrbanRules } from './rules.js'

export const urbanPack = {
  id: 'urban',
  name: '职场',
  icon: '💼',
  tagline: '商战职场，从月薪三千到商业帝国',
  gameTitle: 'Agent职场',
  theme: {
    accent: '#5ec8ff', accent2: '#2a8fd4', accentDim: '#1f6f9e',
    glow: 'rgba(94,200,255,.32)',
    bg: '#0b121a', bg2: '#12202e', bg3: '#080e14',
    panel: 'rgba(18,32,48,.82)', panel2: 'rgba(24,44,66,.55)',
    line: 'rgba(120,180,220,.14)', line2: 'rgba(120,180,220,.28)',
    text: '#d7e6f5', dim: '#7f9bb0', faint: '#5a7084',
    jade: '#63d4c8', blue: '#5ec8ff', red: '#ff6b7a', purple: '#9b8cff',
    fontDisplay: '"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
    fontBody: '"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
    fontEvent: '"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif',
    radius: '4px',
    deco: 'linear-gradient(rgba(94,200,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,200,255,.04) 1px, transparent 1px)',
    decoSize: '36px 36px, 36px 36px',
    cardBg: 'linear-gradient(135deg, rgba(20,40,60,.8), rgba(12,24,40,.85))'
  },
  defaultName: '职场新人',
  startText: '你拖着行李箱走出地铁站，明天要去报到，银行卡里只有三千块。',
  features: { lifespan: false, levelPressure: false, marriage: true },
  ui: {
    advanceBtn: '📈 晋升',
    advanceVerb: '晋升',
    advanceTo: '晋升为',
    advancePeak: '已至行业传奇',
    advanceSuccessTitle: '晋升成功',
    lifeWarn: '状态不佳',
    talkBtn: '社交',
    fightBtn: '竞标/对抗',
    powerLabel: '影响力'
  },
  sceneActions: [
    { id: 'travel', label: '🚇 全城走动', prompt: '我在城里走动，收集信息与机会。' },
    { id: 'talk', label: '☕ 社交应酬', prompt: '我约人喝咖啡应酬，拓展人脉。' },
    { id: 'fight', label: '💼 谈判竞争', prompt: '我去谈一单生意，或与竞争对手正面交锋。' },
    { id: 'search', label: '🔎 找机会', prompt: '我找工作机会、项目线索和风口。' },
    { id: 'rest', label: '😴 休息充电', prompt: '我回家休息充电，梳理思路。' }
  ],
  worlds: ['本地', '国内', '国际'],
  worldMaxTier: { 本地: 3, 国内: 6, 国际: 8 },
  subNames: ['起步', '进阶', '娴熟', '精通'],
  subPower: [1, 1.3, 1.7, 2.0],
  lexicon: {
    spouse: '配偶',
    propose: '求婚',
    divorce: '解除关系',
    level: '社会段位',
    progress: '声望经验',
    money: { main: '现金', mid: '理财', high: '资产' },
    companion: '人脉',
    skill: '专业技能',
    power: '影响力',
    technique: '方法论',
    startBtn: '开始奋斗',
    welcomeTitle: 'Agent职场',
    welcomeSub: 'AI驱动的开放世界职场商战',
    nav: {
      quests: '任务',
      scene: '当前位置', map: '城市地图', profile: '个人档案',
      friends: '人脉', bag: '资产包', settings: '设置'
    }
  },
  skills: [
    { id: 'tech', name: '技术', prof: '工程师' },
    { id: 'biz', name: '商业', prof: '操盘手' },
    { id: 'media', name: '传媒', prof: '公关专家' },
    { id: 'law', name: '法务', prof: '法务顾问' }
  ],
  typeNames: {
    consumable: '消耗物资', equip: '装备/资产', technique: '课程/方法论',
    material: '素材', special: '证件/机会'
  },
  talentNames: { silver: '天选锦鲤', mind: '过目不忘', network: '社交牛人', ordinary: '普通人' },
  talentCultMul: (t) => (t === 'mind' ? 0.5 : 1),
  breakthroughGrade: '晋升机会',
  pillPct: { 普通: 5, 精良: 10, 稀有: 20, 传说: 30 },
  pillPriceK: 15,
  artPriceK: 80,
  breakthroughPriceK: 20,
  artPower: { 普通: 0.1, 精良: 0.18, 稀有: 0.32, 传说: 0.5 },
  cultYears: [1, 3, 8, 16, 30, 50, 80, 120, 180, 240],
  startLoc: 'u_apartment',
  tiers: [
    { name: '月薪三千', lifespan: 80, subNames: ['起步', '适应', '熟练'] },
    { name: '月薪过万', lifespan: 80 },
    { name: '小主管', lifespan: 85 },
    { name: '部门经理', lifespan: 85 },
    { name: '总监', lifespan: 90 },
    { name: '高管', lifespan: 90 },
    { name: '创业新贵', lifespan: 95 },
    { name: '行业大佬', lifespan: 100 },
    { name: '资本巨鳄', lifespan: 110 },
    { name: '行业传奇', lifespan: 120 }
  ],
  createMap: createUrbanMap,
  buildRules: buildUrbanRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    if (to.world === '国内' && S.tierIndex < 2) return '异地发展需至少小主管积累'
    if (to.world === '国际' && S.tierIndex < 5) return '出海需高管级资源与人脉'
    return null
  },
  travelDays(S, c, t) {
    const speed = 1 + S.tierIndex * 0.3
    let raw = 1
    if (c.world !== t.world) raw = 14
    else if (c.continent !== t.continent) raw = 3
    return Math.max(0, Math.floor(raw / speed))
  },
  createInitState() {
    return {
      ageDays: 22 * 360,
      money: { main: 3000, mid: 0, high: 0 },
      startInventory: [
        {
          name: '旧笔记本电脑', desc: '还能干活的生产工具', type: 'equip',
          realm_index: 0, grade: '普通', price: 1500, count: 1
        }
      ],
      startEvents: [{ age: '22岁0月0天', text: '你入职了一家小公司，月薪三千，故事开始。' }]
    }
  }
}
