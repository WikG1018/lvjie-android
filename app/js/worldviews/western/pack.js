// 西幻世界观
import { createWesternMap } from './map.js'
import { buildWesternRules } from './rules.js'

export const westernPack = {
  id: 'western',
  name: '西幻',
  icon: '🏰',
  tagline: '骑士与魔法，从学徒到半神',
  gameTitle: 'Agent西幻',
  theme: {
    accent: '#d4b06a', accent2: '#8b5fc8', accentDim: '#6a4a90',
    glow: 'rgba(180,140,255,.32)',
    bg: '#120e1c', bg2: '#1e1630', bg3: '#0c0a14',
    panel: 'rgba(32,24,48,.82)', panel2: 'rgba(44,32,64,.55)',
    line: 'rgba(180,140,255,.14)', line2: 'rgba(180,140,255,.3)',
    text: '#efe4d8', dim: '#b0a0c8', faint: '#7a6888',
    jade: '#8fd6a0', blue: '#9ab8ff', red: '#e08090', purple: '#b48cff',
    fontDisplay: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontBody: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontEvent: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    radius: '2px 12px 2px 12px',
    deco: 'radial-gradient(ellipse at 50% 0%, rgba(180,140,255,.08), transparent 55%)',
    cardBg: 'linear-gradient(160deg, rgba(50,36,72,.8), rgba(28,20,42,.85))'
  },
  defaultName: '无名旅者',
  startText: '王国边缘的村庄里，你测出了微弱的魔力光辉。',
  features: { lifespan: true, levelPressure: true, marriage: true },
  ui: {
    advanceBtn: '✨ 晋阶',
    advanceVerb: '晋阶',
    advanceTo: '晋阶至',
    advancePeak: '已至神座之巅',
    advanceSuccessTitle: '晋阶成功',
    lifeWarn: '神力枯竭',
    talkBtn: '交谈',
    fightBtn: '挑战'
  },
  sceneActions: [
    { id: 'travel', label: '🗺️ 冒险远行', prompt: '我接下委托，踏上冒险旅途。' },
    { id: 'talk', label: '💬 与人交谈', prompt: '我在酒馆或公会与人交谈，打探情报。' },
    { id: 'fight', label: '⚔️ 讨伐魔物', prompt: '我挑战魔物或强大的对手！' },
    { id: 'search', label: '🔮 探索遗迹', prompt: '我探索遗迹、地牢与魔法节点。' },
    { id: 'rest', label: '🌙 冥想回魔', prompt: '我冥想回魔，整理技能树。' }
  ],
  worlds: ['王国', '大陆', '神域'],
  worldMaxTier: { 王国: 4, 大陆: 7, 神域: 10 },
  subNames: ['初期', '中期', '后期', '大成'],
  subPower: [1, 1.25, 1.6, 1.9],
  lexicon: {
    spouse: '伴侣',
    propose: '求婚',
    divorce: '解除关系',
    level: '位阶',
    progress: '魔力/经验',
    money: { main: '银币', mid: '金币', high: '魔晶' },
    companion: '同伴',
    skill: '副职',
    power: '战力',
    technique: '技能树',
    startBtn: '开启冒险',
    welcomeTitle: 'Agent西幻',
    welcomeSub: 'AI驱动的开放世界西幻之旅',
    nav: {
      quests: '委托',
      scene: '当前位置', map: '大陆地图', profile: '角色档案',
      friends: '同伴', bag: '行囊', settings: '设置'
    }
  },
  skills: [
    { id: 'alchemy', name: '炼金', prof: '炼金术士' },
    { id: 'smith', name: '锻造', prof: '锻造师' },
    { id: 'rune', name: '铭文', prof: '铭文师' },
    { id: 'herb', name: '药草', prof: '药剂师' }
  ],
  typeNames: {
    consumable: '药剂', equip: '武装', technique: '技能/魔法',
    material: '素材', special: '圣物/卷轴'
  },
  talentNames: { dragon: '龙血觉醒', star: '星辉亲和', holy: '圣光眷顾', ordinary: '凡人' },
  talentCultMul: (t) => (t === 'star' ? 0.5 : 1),
  breakthroughGrade: '突破卷轴',
  pillPct: { 凡品: 5, 优质: 10, 精良: 20, 传说: 30 },
  pillPriceK: 18,
  artPriceK: 100,
  breakthroughPriceK: 24,
  artPower: { 凡品: 0.1, 优质: 0.18, 精良: 0.32, 传说: 0.55 },
  cultYears: [2, 12, 40, 120, 400, 1500, 6000, 25000, 100000, 400000, 1000000],
  startLoc: 'wv_village',
  tiers: [
    { name: '学徒', lifespan: 70, subNames: ['初期', '中期', '后期', '大成'] },
    { name: '正式', lifespan: 80 },
    { name: '资深', lifespan: 100 },
    { name: '精英', lifespan: 120 },
    { name: '大师', lifespan: 150 },
    { name: '大法师/圣骑士', lifespan: 200 },
    { name: '传奇', lifespan: 400 },
    { name: '史诗', lifespan: 800 },
    { name: '半神', lifespan: 3000 },
    { name: '神', lifespan: Infinity },
    { name: '主神', lifespan: Infinity }
  ],
  createMap: createWesternMap,
  buildRules: buildWesternRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    if (to.world === '大陆' && S.tierIndex < 3) return '离开王国需精英阶位以上声望与实力'
    if (to.world === '神域' && S.tierIndex < 7) return '神域需史诗以上'
    return null
  },
  travelDays(S, c, t) {
    const speed = Math.pow(1.7, Math.max(0, S.tierIndex))
    let raw = 6
    if (c.world !== t.world) raw = 200
    else if (c.continent !== t.continent) raw = 40
    return Math.max(0, Math.floor(raw / speed))
  },
  createInitState() {
    return {
      ageDays: 16 * 360,
      startInventory: [
        { name: '初级治疗药剂', desc: '恢复少量魔力/体力', type: 'consumable', realm_index: 0, grade: '凡品', price: 8, count: 2, usable: 'direct', use_effect: { type: 'progress', value: 1 } },
        { name: '木训练剑', desc: '学徒用训练武器', type: 'equip', realm_index: 0, grade: '凡品', price: 5, count: 1 }
      ],
      startEvents: [{ age: '16岁0月0天', text: '你离开村庄，打算去最近的冒险者公都会看看。' }]
    }
  }
}
