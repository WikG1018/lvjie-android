// 婚姻系统：可多伴侣（后宫）
import { packFeatures } from './pack-ui.js'

export const PROPOSE_MIN_FAVOR = 50

export function marriageEnabled(pack) {
  return packFeatures(pack).marriage !== false
}

export function haremEnabled(pack) {
  // 默认允许后宫；包可 features.harem=false 强制单偶
  return packFeatures(pack).harem !== false
}

export function spouseLabel(f, pack) {
  if (!f || !f.married) return ''
  const word = (pack && pack.lexicon && pack.lexicon.spouse) || '伴侣'
  if (f.married === 'wife') return '女' + word
  if (f.married === 'husband') return '男' + word
  return word
}

export function spouseWord(pack) {
  return (pack && pack.lexicon && pack.lexicon.spouse) || '伴侣'
}

export function proposeWord(pack) {
  return (pack && pack.lexicon && pack.lexicon.propose) || '求婚'
}

export function divorceWord(pack) {
  return '解除关系'
}

export function marriedList(S) {
  return (S && S.friends || []).filter(f => f && f.married)
}

export function canPropose(f, S, pack) {
  if (!f || !marriageEnabled(pack)) return false
  if (f.married) return false
  if (!haremEnabled(pack) && marriedList(S).length > 0) return false
  if (!isSameLocation(S, f)) return false
  return (Number(f.favor) || 0) >= PROPOSE_MIN_FAVOR
}

export function isSameLocation(S, f) {
  if (!S || !f) return false
  const name = f.name
  const loc = (S.map || []).find(l => l.id === S.currentLoc)
  if (loc && (loc.people || []).some(p => p && p.name === name)) return true
  // 同伴可能不在 people 列表：有位置则必须同图；无明确位置（同行/档案 NPC）视为可交互
  let found = false
  for (const l of S.map || []) {
    if ((l.people || []).some(p => p && p.name === name)) {
      found = true
      return l.id === S.currentLoc
    }
  }
  if (!found) {
    // 不在任何 map.people：已结识 NPC 视为同行/可遇到，避免求婚恒失败
    return true
  }
  return false
}

export function forceDivorce(S, friend, pack) {
  if (!friend || !friend.married) return
  friend.married = null
  S.spouses = marriedList(S).map(x => x.name)
}

export function propose(S, friend, pack) {
  if (!S || !friend) return { ok: false, msg: '无效对象' }
  if (!canPropose(friend, S, pack)) {
    return { ok: false, msg: '当前无法' + proposeWord(pack) }
  }
  const favor = Number(friend.favor) || 0
  if (favor < PROPOSE_MIN_FAVOR) {
    return { ok: false, msg: `好感不足（需 ${PROPOSE_MIN_FAVOR}）` }
  }
  if (pack && !isSameLocation(S, friend)) {
    return { ok: false, msg: '需要在同一场景才能' + proposeWord(pack) }
  }
  if (friend.married) return { ok: false, msg: '对方已有' + spouseWord(pack) }
  if (!haremEnabled(pack) && marriedList(S).length > 0) {
    return { ok: false, msg: '此界仅可有一位' + spouseWord(pack) }
  }
  // 按对方性别记伴侣，允许同性；未知性别默认女
  const spouse = friend.gender === '男' ? 'husband' : friend.gender === '女' ? 'wife' : 'wife'
  friend.married = spouse
  friend.favor = favor + 10
  friend.mem = friend.mem ? (friend.mem + '；与你结为' + spouseWord(pack) + '。') : ('与你结为' + spouseWord(pack) + '。')
  const list = marriedList(S).map(x => x.name)
  S.spouses = list
  return { ok: true, msg: `与${friend.name}结为${spouseWord(pack)}` }
}

export function divorce(S, friend, pack) {
  if (!S || !friend || !friend.married) return { ok: false, msg: '未处于婚姻关系' }
  friend.married = null
  friend.favor = Math.max(0, (Number(friend.favor) || 0) - 20)
  S.spouses = marriedList(S).map(x => x.name)
  return { ok: true, msg: `与${friend.name}${divorceWord(pack)}` }
}


export function addGrudge(f, to, kind, note) {
  if (!f) return { ok: false }
  const list = Array.isArray(f.grudges) ? f.grudges.slice() : []
  const k = kind === '恩' ? '恩' : kind === '仇' ? '仇' : kind === '债' ? '债' : '怨'
  list.unshift({ to: String(to || '玩家'), kind: k, note: String(note || '').slice(0, 40) })
  f.grudges = list.slice(0, 8)
  return { ok: true }
}

export function removeGrudge(f, index) {
  if (!f || !Array.isArray(f.grudges) || !f.grudges.length) return { ok: false }
  const i = Math.min(f.grudges.length - 1, Math.max(0, Math.floor(Number(index) || 0)))
  f.grudges.splice(i, 1)
  return { ok: true }
}

/** 负好感 / 仇人 → 同步关系网与恩怨 */
export function syncFavorToRelations(f) {
  if (!f) return
  const favor = Number(f.favor) || 0
  if (favor < 0) {
    if (!f.relType || f.relType === '熟人' || f.relType === '伙伴') f.relType = '仇人'
    const list = Array.isArray(f.grudges) ? f.grudges.slice() : []
    if (!list.some(g => g && g.to === '玩家')) {
      list.unshift({ to: '玩家', kind: '怨', note: '好感跌至 ' + favor })
      f.grudges = list.slice(0, 8)
    }
  }
}
