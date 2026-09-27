// 世界观包共享默认值：升级动词 / 玩法开关 / 场景行动
// 各 pack 可覆盖；未写的字段从这里取

export const DEFAULT_FEATURES = {
  lifespan: true,      // 是否有寿限（都市=false）
  meditate: false,     // 是否有本地「闭关/打工」按钮（后续可开）
  levelPressure: true, // 是否强调位阶差序（高阶压制/低阶敬畏）
  marriage: true,      // 亲密关系是否提供战力加成语义
  talkRemote: true     // 同伴可远程联系（武侠神识传音/都市电话）
}

export const DEFAULT_UI = {
  advanceBtn: '突破',
  advanceVerb: '突破',
  advanceFail: null,     // 运行时按 progress 词生成
  advanceTo: '突破至',
  advancePeak: '已至当前尽头',
  advanceSuccessTitle: '突破成功',
  lifeWarn: '寿限将尽',
  powerLabel: null       // 缺省用 lexicon.power
}

/** 合并 features / ui */
export function packUi(pack) {
  return Object.assign({}, DEFAULT_UI, pack.ui || {}, {
    powerLabel: (pack.ui && pack.ui.powerLabel) || (pack.lexicon && pack.lexicon.power) || '战力'
  })
}

export function packFeatures(pack) {
  return Object.assign({}, DEFAULT_FEATURES, pack.features || {})
}

/** 默认场景行动：各包应自带 sceneActions；此处仅兜底 */
export function sceneActionsOf(pack) {
  if (Array.isArray(pack.sceneActions) && pack.sceneActions.length) return pack.sceneActions
  return [
    { id: 'roam', label: '🚶 四处走走', prompt: '我在附近四处走走，观察环境。' },
    { id: 'talk', label: '💬 与人交谈', prompt: '我想找人聊聊天，打听消息。' },
    { id: 'fight', label: '⚔️ 挑战强者', prompt: '我向附近较强的对手发起挑战！' },
    { id: 'search', label: '🔍 搜寻机缘', prompt: '我仔细搜索此地，寻找机缘与宝物。' },
    { id: 'rest', label: '🧘 调息休整', prompt: '我找个安全的地方调息休整。' }
  ]
}
