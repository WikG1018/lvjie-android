// 玄幻世界观（原创词表，避免贴靠特定网文作品）
import { createXuanhuanMap } from './map.js'
import { buildXuanhuanRules } from './rules.js'

export const xuanhuanPack = {
  id: 'xuanhuan',
  name: '玄幻',
  icon: '🌌',
  tagline: '苍澜大陆，从凡阶到神台',
  gameTitle: 'Agent玄幻',
  theme: {
    accent: '#7b6cff', accent2: '#4a3fd4', accentDim: '#3529a0',
    glow: 'rgba(123,108,255,.35)',
    bg: '#0a0818', bg2: '#14102c', bg3: '#070512',
    panel: 'rgba(28,22,58,.84)', panel2: 'rgba(42,32,78,.55)',
    line: 'rgba(150,130,255,.16)', line2: 'rgba(150,130,255,.32)',
    text: '#e4def8', dim: '#a89cc8', faint: '#6e6494',
    jade: '#7ddea8', blue: '#7eb0ff', red: '#ff7a8e', purple: '#c39bff',
    fontDisplay: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontBody: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontEvent: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    radius: '10px',
    cardBg: 'linear-gradient(155deg, rgba(48,32,96,.82), rgba(24,16,52,.9))'
  },
  defaultName: '无名少年',
  startText: '苍澜历三七九年，你在青石镇觉醒了微弱的灵根，踏上修行之路。',
  features: { lifespan: true, levelPressure: true, marriage: true },
  ui: {
    advanceBtn: '🔥 破境',
    advanceVerb: '破境',
    advanceTo: '破入',
    advancePeak: '已立神台',
    advanceSuccessTitle: '破境成功',
    lifeWarn: '寿元将尽',
    talkBtn: '交谈',
    fightBtn: '挑战',
    powerLabel: '战力'
  },
  sceneActions: [
    { id: 'travel', label: '🗺️ 闯荡苍澜', prompt: '我外出闯荡，寻找机缘。' },
    { id: 'talk', label: '💬 攀谈结交', prompt: '我与附近的人攀谈，打探消息。' },
    { id: 'fight', label: '⚔️ 挑战强者', prompt: '我向附近的凶兽或强者发起挑战！' },
    { id: 'search', label: '🔍 搜寻灵物', prompt: '我搜寻灵草、传承与遗迹线索。' },
    { id: 'cultivate', label: '🌀 吐纳炼气', prompt: '我盘膝吐纳炼气，夯实修为。' }
  ],
  worlds: ['青石镇', '苍澜域', '天外神墟'],
  worldMaxTier: { 青石镇: 4, 苍澜域: 7, 天外神墟: 9 },
  subNames: ['初期', '中期', '后期'],
  subPower: [1, 1.25, 1.6],
  lexicon: {
    spouse: '道侣',
    propose: '结为道侣',
    divorce: '解除关系',
    level: '境界',
    progress: '灵力',
    money: { main: '金币', mid: '灵玉', high: '神晶' },
    companion: '同伴',
    skill: '技艺',
    power: '战力',
    technique: '传承',
    startBtn: '踏入苍澜',
    welcomeTitle: 'Agent玄幻',
    welcomeSub: 'AI驱动的开放世界玄幻之旅',
    nav: {
      quests: '任务',
      scene: '当前场景', map: '世界地图', profile: '人物信息',
      friends: '同伴', bag: '行囊', settings: '设置'
    }
  },
  skills: [
    { id: 'smith', name: '炼器', prof: '炼器师' },
    { id: 'alchemy', name: '炼丹', prof: '丹师' },
    { id: 'rune', name: '符纹', prof: '符纹师' },
    { id: 'beast', name: '御兽', prof: '御兽师' }
  ],
  typeNames: {
    consumable: '丹药', equip: '神兵', technique: '传承', material: '灵材', special: '杂物'
  },
  talentNames: { profound: '玄灵体', swift: '悟性通神', firm: '道心坚定', mortal: '凡骨' },
  talentCultMul: (t) => (t === 'profound' ? 0.5 : 1),
  breakthroughGrade: '破境丹',
  pillPct: { 凡品: 5, 灵品: 10, 玄品: 20, 神品: 30 },
  pillPriceK: 16,
  artPriceK: 90,
  breakthroughPriceK: 22,
  artPower: { 凡品: 0.1, 灵品: 0.18, 玄品: 0.3, 神品: 0.5 },
  cultYears: [2, 8, 20, 50, 120, 300, 800, 2000, 6000, 20000, 80000],
  startLoc: 'x_town',
  tiers: [
    { name: '聚气境', lifespan: 100, subNames: ['初期', '中期', '后期'] },
    { name: '凝元境', lifespan: 130 },
    { name: '通玄境', lifespan: 180 },
    { name: '地元境', lifespan: 260 },
    { name: '天元境', lifespan: 400 },
    { name: '法相境', lifespan: 700 },
    { name: '洞虚境', lifespan: 1500 },
    { name: '界主境', lifespan: 5000 },
    { name: '圣域', lifespan: 50000 },
    { name: '神台', lifespan: Infinity }
  ],
  createMap: createXuanhuanMap,
  buildRules: buildXuanhuanRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    if (to.world === '苍澜域' && S.tierIndex < 2) return '离开青石镇需至少通玄境'
    if (to.world === '天外神墟' && S.tierIndex < 5) return '踏入神墟需法相境以上修为'
    return null
  },
  createInitState() {
    return {
      ageDays: 16 * 360,
      money: { main: 200, mid: 0, high: 0 },
      startInventory: [
        {
          name: '青锋短剑', desc: '凡品神兵，锋刃尚可', type: 'equip',
          realm_index: 0, grade: '凡品', price: 80
        }
      ],
      startEvents: [{ age: '16岁0月0天', text: '青石镇灵根石碑亮起微光，你踏上了修行之路。' }]
    }
  }
}
