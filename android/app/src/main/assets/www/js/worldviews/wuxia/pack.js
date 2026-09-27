// 武侠世界观
import { createWuxiaMap } from './map.js'
import { buildWuxiaRules } from './rules.js'

export const wuxiaPack = {
  id: 'wuxia',
  name: '武侠',
  icon: '⚔️',
  tagline: '江湖风雨，从无名小卒到一代宗师',
  gameTitle: 'Agent武侠',
  theme: {
    accent: '#c9aa6a', accent2: '#8a7340', accentDim: '#6e5a32',
    glow: 'rgba(201,170,106,.28)',
    bg: '#1a1812', bg2: '#2a261c', bg3: '#12100c',
    panel: 'rgba(42,38,28,.82)', panel2: 'rgba(58,52,38,.55)',
    line: 'rgba(200,180,120,.14)', line2: 'rgba(200,180,120,.28)',
    text: '#e6dcc4', dim: '#a89878', faint: '#7a6c50',
    jade: '#8fbc8f', blue: '#8fa8c8', red: '#c87a6a', purple: '#b8a0c8',
    fontDisplay: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontBody: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    fontEvent: '"Segoe UI","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
    radius: '4px',
    deco: 'radial-gradient(ellipse at 80% 0%, rgba(201,170,106,.06), transparent 50%)',
    cardBg: 'rgba(48,42,30,.78)'
  },
  defaultName: '无名少侠',
  startText: '你背着一柄旧剑，踏入了风雨飘摇的江湖。',
  features: { lifespan: false, levelPressure: true, marriage: true },
  ui: {
    advanceBtn: '✨ 精进',
    advanceVerb: '精进',
    advanceTo: '精进至',
    advancePeak: '已至武道绝巅',
    advanceSuccessTitle: '精进成功',
    lifeWarn: '内伤缠身',
    talkBtn: '交谈',
    fightBtn: '切磋'
  },
  sceneActions: [
    { id: 'travel', label: '🗺️ 闯荡江湖', prompt: '我负剑出行，闯荡江湖。' },
    { id: 'talk', label: '💬 与人交谈', prompt: '我在茶楼酒肆与人交谈，打探江湖消息。' },
    { id: 'fight', label: '⚔️ 切磋比武', prompt: '我向附近的高手邀战切磋！' },
    { id: 'search', label: '🔍 寻访秘籍', prompt: '我寻访武林秘籍、神兵与故人遗迹。' },
    { id: 'cultivate', label: '🧘 运功打坐', prompt: '我运功调息，温养经脉内力。' }
  ],
  worlds: ['中原', '西域', '塞外'],
  worldMaxTier: { 中原: 5, 西域: 6, 塞外: 6 },
  subNames: ['初期', '中期', '后期', '大成'],
  subPower: [1, 1.3, 1.7, 2.0],
  lexicon: {
    spouse: '眷侣',
    propose: '结为眷侣',
    divorce: '解除关系',
    level: '武功境界',
    progress: '内力',
    money: { main: '银两', mid: '金叶', high: '奇珍' },
    companion: '江湖故人',
    skill: '杂学',
    power: '战力',
    technique: '武学',
    startBtn: '踏入江湖',
    welcomeTitle: 'Agent武侠',
    welcomeSub: 'AI驱动的开放世界武侠之旅',
    nav: {
      quests: '托付',
      scene: '当前场景', map: '江湖地图', profile: '人物信息',
      friends: '故人', bag: '行囊', settings: '设置'
    }
  },
  skills: [
    { id: 'medicine', name: '医术', prof: '医师' },
    { id: 'poison', name: '毒术', prof: '毒师' },
    { id: 'weapon', name: '锻造', prof: '铸剑师' },
    { id: 'iq', name: '谋略', prof: '谋士' }
  ],
  typeNames: {
    consumable: '丹丸', equip: '兵器', technique: '武功秘籍',
    material: '药材', special: '信物'
  },
  talentNames: { swordbone: '先天剑骨', hollow: '武学奇才', tough: '铜皮铁骨', ordinary: '资质平平' },
  talentCultMul: (t) => (t === 'hollow' ? 0.5 : 1),
  breakthroughGrade: '破境丹',
  pillPct: { 下品: 6, 中品: 12, 上品: 22, 极品: 35 },
  pillPriceK: 18,
  artPriceK: 90,
  breakthroughPriceK: 22,
  artPower: { 下品: 0.12, 中品: 0.2, 上品: 0.35, 极品: 0.55 },
  cultYears: [1, 8, 25, 60, 150, 400, 1000, 2500, 6000, 15000],
  startLoc: 'w_luoyang',
  tiers: [
    { name: '不入流', lifespan: 70, subNames: ['初窥', '小成', '贯通'] },
    { name: '三流', lifespan: 80 },
    { name: '二流', lifespan: 90 },
    { name: '一流', lifespan: 100 },
    { name: '超一流', lifespan: 120 },
    { name: '宗师', lifespan: 150 },
    { name: '大宗师', lifespan: 200 },
    { name: '陆地神仙', lifespan: 300 },
    { name: '破碎虚空', lifespan: Infinity }
  ],
  createMap: createWuxiaMap,
  buildRules: buildWuxiaRules,
  gateRules(from, to, S) {
    if (!from || !from.world) return null
    if (to.world === '西域' && S.tierIndex < 2) return '闯西域需二流以上身手'
    if (to.world === '塞外' && S.tierIndex < 3) return '出塞需一流身手'
    if (from.world === to.world && from.continent !== to.continent && S.tierIndex < 2) return '跨省行走需二流以上'
    return null
  },
  travelDays(S, c, t) {
    const speed = Math.pow(1.6, Math.max(0, S.tierIndex))
    let raw = 5
    if (c.world !== t.world) raw = 60
    else if (c.continent !== t.continent) raw = 25
    return Math.max(0, Math.floor(raw / speed))
  },
  createInitState() {
    return {
      ageDays: 18 * 360,
      startInventory: [
        {
          name: '金创药', desc: '下品伤药（游戏内作恢复精神，不直接加内力）', type: 'consumable',
          realm_index: 0, grade: '下品', price: 5, count: 2,
          usable: 'direct', use_effect: { type: 'progress', value: 0.5 }
        }
      ],
      startEvents: [{ age: '18岁0月0天', text: '你辞别师门，单剑踏入江湖。' }]
    }
  }
}
