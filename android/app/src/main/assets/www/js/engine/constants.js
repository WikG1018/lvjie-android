// 引擎常量（与具体世界观无关）
export const SAVE_KEY = 'agentworlds_save_v1' // 旧单槽；载入时迁入分槽
export const ACTIVE_WORLD_KEY = 'agentworlds_active_world_v2'
export const SLOT_PREFIX = 'agentworlds_slot_v2_'
export const KEYS_KEY = 'agentworlds_apikeys_v1'
export const META_KEY = 'agentworlds_meta_v1'
export const GLOBAL_PREFS_KEY = 'agentworlds_prefs_v1'

export const SAVE_VERSION = 1
export const MAX_EVENT_CHOICES = 10
export const MAX_TALK_PER_DAY = 5

// 物品类型（引擎中性；各包可扩展 display 名）
export const LEGACY_TYPE_MAP = {
  pill: 'consumable',
  artifact: 'equip',
  manual: 'technique',
  material: 'material',
  other: 'special'
}

// AI 风格
export const AI_STYLES = {
  cheat: { name: '开挂', desc: '有求必应：无论要求是否合理，AI都会满足你（只想爽一把时用）' },
  generous: { name: '慷慨', desc: '更容易顺着你，出格的行动也常能得逞；奖励普遍更丰厚' },
  normal: { name: '正常', desc: '合理则成、离谱则被驳回；奖励适中' },
  hard: { name: '艰难', desc: '严格把关，离谱的行动基本会被驳回；奖励更吝啬、机缘更凶险' }
}
export const AI_STYLE_ORDER = ['cheat', 'generous', 'normal', 'hard']

export const PLAYER_GENDERS = [
  { v: '', name: '不选择' },
  { v: 'male', name: '男' },
  { v: 'female', name: '女' }
]

// 背景音乐（相对 app 目录）；mp3 用 <audio>，mid 用 Web Audio 合成
export const BGM_TRACKS = [
  { id: '', name: '无音乐', file: '' },
  { id: 'm027', name: 'M027', file: 'assets/M027.mp3' },
  { id: 'xj-slow', name: '静谧 030', file: 'assets/xj-缓-030.mid' },
  { id: 'xj-soft', name: '舒缓 033', file: 'assets/xj-舒-033.mid' },
  { id: 'xj-walk', name: '行旅 010', file: 'assets/xj-行-010.mid' },
  { id: 'xj-gentle', name: '柔情 015', file: 'assets/xj-柔-015.mid' },
  { id: 'xj-town', name: '人间 028', file: 'assets/xj-镇-028.mid' },
  { id: 'xj-battle', name: '交锋 037', file: 'assets/xj-战-037.mid' },
  { id: 'xj-blaze', name: '激燃 039', file: 'assets/xj-烈-039.mid' },
  { id: 'xj-rise', name: '昂扬 049', file: 'assets/xj-扬-049.mid' },
  { id: 'xj-still', name: '空静 063', file: 'assets/xj-静-063.mid' },
  { id: 'xj-soul', name: '魂牵 068', file: 'assets/xj-魂-068.mid' },
  { id: 'midi-031', name: '031.MID', file: 'assets/031.mid' }
]

/** 各世界观默认曲（可被存档 bgmTrack 覆盖）；现统一默认 M027 */
export const PACK_BGM = {
  xiuxian: 'm027',
  xuanhuan: 'm027',
  wuxia: 'm027',
  urban: 'm027',
  apocalypse: 'm027',
  western: 'm027'
}

/** 主玩法页默认曲 */
export const BGM_MAP_TRACK = 'm027'
export const BGM_DEFAULT_TRACK = 'm027'
export const BGM_DEFAULT = 'm027'

/** 使用默认曲的界面 */
export const BGM_DEFAULT_TABS = ['scene', 'map', 'profile', 'friends', 'quests', 'bag', 'settings']

export const LANGUAGE_OPTIONS = [
  { id: 'zh-CN', name: '简体中文', promptLang: '简体中文', storyHint: '中文小说句' },
  { id: 'zh-TW', name: '繁體中文', promptLang: '繁體中文', storyHint: '繁體小說句' },
  { id: 'en', name: 'English', promptLang: 'English', storyHint: 'English prose' },
  { id: 'ja', name: '日本語', promptLang: '日本語', storyHint: '日本語の地の文' }
]

export function langPack(id) {
  return LANGUAGE_OPTIONS.find(x => x.id === id) || LANGUAGE_OPTIONS[0]
}
