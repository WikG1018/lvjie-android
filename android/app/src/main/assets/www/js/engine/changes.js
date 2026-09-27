// 应用 AI 返回的 changes JSON
import { addItem, removeItem, normalizeType } from './inventory.js'
import { applyNewLocations, applyModifyLocations, applyRemoveLocations, moveByName, gateReason } from './map.js'
import { fmtNum, ageLabel } from './util.js'
import { packOf, tierLabel } from './progression.js'
import { syncReverseRelations } from './npc-memory.js'
import { forceDivorce, syncFavorToRelations } from './marriage.js'
import { normalizeRelType } from './npc-memory.js'
import { applyQuestChanges } from './quests.js'

/** 单轮熔断：防 AI 刷爆数值 */
export const CHANGE_CAPS = {
  age_days: 3650,
  money_abs: 10_000_000,
  progress_abs: 5_000_000,
  item_count: 99,
  add_items: 10,
  remove_items: 10,
  major_events: 8,
  small_events: 12,
  friends: 6,
  new_locations: 6,
  modify_locations: 10,
  favor_abs: 80,
  skill_abs: 200,
  power_abs: 1_000_000,
  faction_rep_abs: 500
}

function capAbs(v, lim) {
  const n = Number(v) || 0
  if (n > lim) return lim
  if (n < -lim) return -lim
  return n
}

function capCount(v, lim) {
  const n = Math.round(Number(v) || 0)
  return Math.max(0, Math.min(lim, n))
}

/**
 * @returns {{major:string[], minor:string[]}} 弹窗用变更摘要
 */
export function applyChanges(S, ch, hooks = {}) {
  const major = []
  const minor = []
  if (!ch || typeof ch !== 'object') return { major, minor }
  if (!Array.isArray(S.bigEvents)) S.bigEvents = []
  if (!Array.isArray(S.smallEvents)) S.smallEvents = []
  if (!Array.isArray(S.friends)) S.friends = []
  if (!Array.isArray(S.inventory)) S.inventory = []
  if (!Array.isArray(S.quests)) S.quests = []
  if (!S.money || typeof S.money !== 'object') S.money = { main: 0, mid: 0, high: 0 }

  const pack = packOf(S)
  const moneyName = (slot) => (pack.lexicon.money && pack.lexicon.money[slot]) || '货币'
  const progName = pack.lexicon.progress || '进度'

  if (ch.age_days) {
    const d = Math.round(capAbs(Number(ch.age_days) || 0, CHANGE_CAPS.age_days))
    if (d) {
      S.ageDays = Math.max(0, S.ageDays + d)
      minor.push(`年龄 ${d > 0 ? '+' : ''}${d} 天`)
    }
  }

  // 货币：兼容旧字段名
  const moneyAdd = [
    ['main', ['ling_shi', 'money_main', 'currency', 'money']],
    ['mid', ['shang_pin', 'money_mid']],
    ['high', ['xian_yuan', 'money_high']]
  ]
  for (const [slot, keys] of moneyAdd) {
    for (const k of keys) {
      if (ch[k] != null) {
        const v = Math.round(capAbs(Number(ch[k]) || 0, CHANGE_CAPS.money_abs))
        if (v) {
          const next = (S.money[slot] || 0) + v
          // 货币不为负；扣超持有则扣到 0
          if (next < 0) {
            const actual = -(S.money[slot] || 0)
            S.money[slot] = 0
            if (actual) minor.push(`${moneyName(slot)} ${fmtNum(actual)}`)
          } else {
            S.money[slot] = next
            minor.push(`${moneyName(slot)} ${v > 0 ? '+' : ''}${fmtNum(v)}`)
          }
        }
        break
      }
    }
  }

  if (ch.cultivation != null || ch.progress != null) {
    const v = capAbs(Number(ch.cultivation != null ? ch.cultivation : ch.progress) || 0, CHANGE_CAPS.progress_abs)
    if (v) {
      S.progress = Math.max(0, S.progress + v)
      minor.push(`${progName} ${v > 0 ? '+' : ''}${fmtNum(v)}`)
    }
  }

  if (Array.isArray(ch.add_items)) {
    for (const raw of ch.add_items.slice(0, CHANGE_CAPS.add_items)) {
      if (!raw || !raw.name) continue
      const it = Object.assign({}, raw, { type: normalizeType(raw.type) })
      const n = capCount(raw.count || 1, CHANGE_CAPS.item_count)
      addItem(S, it, n)
      major.push(`获得 ${raw.name}×${n}`)
    }
  }

  if (Array.isArray(ch.remove_items)) {
    for (const raw of ch.remove_items.slice(0, CHANGE_CAPS.remove_items)) {
      if (!raw || !raw.name) continue
      const n = capCount(raw.count || 1, CHANGE_CAPS.item_count)
      if (removeItem(S, raw, n)) {
        minor.push(`失去 ${raw.name}${n > 1 ? '×' + n : ''}`)
      }
    }
  }

  if (Array.isArray(ch.major_events)) {
    for (const e of ch.major_events.slice(0, CHANGE_CAPS.major_events)) {
      if (!e) continue
      S.bigEvents.push({ age: ageLabel(S.ageDays), text: String(e).slice(0, 200) })
      major.push(String(e).slice(0, 120))
    }
    if (S.bigEvents.length > 200) S.bigEvents = S.bigEvents.slice(-200)
  }
  if (Array.isArray(ch.small_events)) {
    for (const e of ch.small_events.slice(0, CHANGE_CAPS.small_events)) {
      if (!e) continue
      S.smallEvents.push({ age: ageLabel(S.ageDays), text: String(e).slice(0, 200) })
      minor.push(String(e).slice(0, 120))
    }
    if (S.smallEvents.length > 200) S.smallEvents = S.smallEvents.slice(-200)
  }
  // 兼容 major_event / small_event 单数
  if (ch.major_event) {
    S.bigEvents.push({ age: ageLabel(S.ageDays), text: String(ch.major_event) })
    major.push(String(ch.major_event))
    if (S.bigEvents.length > 200) S.bigEvents = S.bigEvents.slice(-200)
  }
  if (ch.small_event) {
    S.smallEvents.push({ age: ageLabel(S.ageDays), text: String(ch.small_event) })
    minor.push(String(ch.small_event))
    if (S.smallEvents.length > 200) S.smallEvents = S.smallEvents.slice(-200)
  }

  if (ch.skills && typeof ch.skills === 'object') {
    for (const [k, v] of Object.entries(ch.skills)) {
      const key = skillKeyFor(S, pack, k)
      if (!key) continue
      const d = Math.round(capAbs(Number(v) || 0, CHANGE_CAPS.skill_abs))
      if (d) {
        S.skills[key] = Math.max(0, (S.skills[key] || 0) + d)
        const sk = pack.skills.find(x => x.id === key)
        minor.push(`${sk ? sk.name : k} +${d}`)
      }
    }
  }

  if (Array.isArray(ch.friends)) {
    for (const raw of ch.friends.slice(0, CHANGE_CAPS.friends)) {
      if (!raw || !raw.name) continue
      let f = S.friends.find(x => x.name === raw.name)
      const rankStr = String(raw.realm || raw.rank || tierLabel(S))
      if (!f) {
        f = {
          name: String(raw.name),
          realm: rankStr,
          gender: raw.gender === '女' ? '女' : raw.gender === '男' ? '男' : '',
          power: Math.abs(Math.round(Number(raw.power) || 0)) > CHANGE_CAPS.power_abs ? CHANGE_CAPS.power_abs : Math.abs(Math.round(Number(raw.power) || 0)),
          intro: String(raw.intro || ''),
          mem: String(raw.mem || ''),
          favor: 0,
          lastDay: '',
          talkCount: 0,
          history: [],
          married: null,
          relType: normalizeRelType(raw.relType || raw.relation_type),
          grudges: normGList(raw.grudges),
          relations: normRelList(raw.relations)
        }
        S.friends.push(f)
        major.push(`结识 ${f.name}`)
      } else {
        if (raw.realm || raw.rank) f.realm = String(raw.realm || raw.rank)
        if (raw.power != null) f.power = Math.abs(Math.round(capAbs(Number(raw.power) || f.power, CHANGE_CAPS.power_abs)))
        if (raw.intro) f.intro = String(raw.intro)
        if (raw.mem) f.mem = String(raw.mem)
        if (raw.gender) f.gender = raw.gender
        if (raw.relType || raw.relation_type) {
          f.relType = normalizeRelType(raw.relType || raw.relation_type)
          if (f.relType === '仇人' && !(f.grudges || []).length) {
            f.grudges = f.grudges || []
            f.grudges.push({ to: '玩家', kind: '怨', note: '敌对关系' })
          }
        }
        if (raw.relations != null) f.relations = mergeRelList(f.relations, raw.relations)
        if (raw.grudges != null) f.grudges = mergeGList(f.grudges, raw.grudges)
      }
      // AI 不得直写 married 绕过求婚规则；仅允许「已成婚叙事」写入或解除
      if (raw.married !== undefined) {
        const want = raw.married === 'wife' || raw.married === 'husband' ? raw.married : null
        if (want && !f.married) {
          // 叙事已写明成婚才接受；不强制抬好感（避免伪造 canPropose 条件）
          const narrSaidMarry = /结为|成婚|成亲|大婚|喜结|伴侣|道侣|眷侣|wife|husband|married/i.test(String(raw.mem || '') + String(raw.intro || ''))
          if (narrSaidMarry || (Number(f.favor) || 0) >= 50) {
            f.married = want
            if (!f.mem || !/结为|伴侣|道侣|眷侣|成婚/.test(f.mem)) {
              f.mem = f.mem ? (f.mem + '；与你结为伴侣。') : '与你结为伴侣。'
            }
            minor.push(`${f.name} 成为伴侣`)
          }
          // 条件不满足则忽略，不写成已婚
        } else if (!want && f.married) {
          forceDivorce(S, f)
          minor.push(`与${f.name}解除关系`)
        }
      }
      // 同步配偶列表（含清空）
      S.spouses = (S.friends || []).filter(x => x && x.married).map(x => x.name)
      // 双向关系回写
      try {
        syncReverseRelations(S, f.name, f.relations, f.grudges)
      } catch (e) { /* ignore */ }
      if (raw.favor != null) {
        const d = Math.round(capAbs(Number(raw.favor) || 0, CHANGE_CAPS.favor_abs))
        f.favor = (f.favor || 0) + d
        if (d) minor.push(`${f.name} 好感 ${d > 0 ? '+' : ''}${d}`)
        syncFavorToRelations(f)
      }
      if (Array.isArray(f.history) && f.history.length > 50) {
        f.history = f.history.slice(-50)
      }
    }
  }

  if (Array.isArray(ch.remove_friends)) {
    for (const n of ch.remove_friends.slice(0, 8)) {
      const gone = S.friends.filter(f => f.name === n)
      gone.forEach(f => {
        if (f.married) {
          forceDivorce(S, f)
          minor.push(`与${f.name}解除关系`)
        }
      })
      S.friends = S.friends.filter(f => f.name !== n)
    }
  }

  applyNewLocations(S, ch.new_locations)
  applyModifyLocations(S, ch.modify_locations)
  applyRemoveLocations(S, ch.remove_locations, pack)
  if (ch.move_to) {
    const t = S.map.find(l => l.name === String(ch.move_to))
    const c = S.map.find(l => l.id === S.currentLoc) || S.map[0]
    const gate = t ? gateReason(S, c || {}, t) : '没有这个地方'
    if (!gate) moveByName(S, String(ch.move_to))
    else if (String(gate) !== '没有这个地方') minor.push(String(gate))
  }

  if (ch.faction_rep != null) {
    const v = Math.round(capAbs(Number(ch.faction_rep) || 0, CHANGE_CAPS.faction_rep_abs))
    S.factionRep = (S.factionRep || 0) + v
    if (v) minor.push(`声望 ${v > 0 ? '+' : ''}${v}`)
  }

  // 不允许 AI 直接改等级
  if (ch.tierIndex != null || ch.realmIndex != null || ch.tier != null) {
    // 忽略
  }

  if (Array.isArray(ch.quests)) {
    const qres = applyQuestChanges(S, ch.quests)
    for (const t of qres.added) major.push(`接取委托「${t}」`)
    for (const t of qres.updated) {
      if (String(t).includes('→done')) major.push(`完成委托「${String(t).split('→')[0]}」`)
      else if (String(t).includes('→failed')) minor.push(`委托失败：${String(t).split('→')[0]}`)
      else minor.push(`委托更新：${t}`)
    }
  }

  return { major, minor }
}

function skillKeyFor(S, pack, k) {
  if (pack.skills.some(s => s.id === k)) return k
  const hit = pack.skills.find(s => s.name === k)
  return hit ? hit.id : null
}

/** 从正文里抽「被赠予」的物品名（书名号/引号优先） */
export function extractGiftNames(narrative) {
  const s = String(narrative || '')
  const names = []
  const push = (n) => {
    const name = String(n || '').trim().replace(/[，。！？…~]+$/, '')
    if (!name || name.length < 2 || name.length > 20) return
    if (!names.includes(name)) names.push(name)
  }
  // 「旧猎道草图」塞给你 / 递给你「x」
  const re1 = /[「“]([^」”\n]{2,20})[」”]\s*(?:塞|递|交|给|塞进|扔|送)/g
  let m
  while ((m = re1.exec(s))) push(m[1])
  const re2 = /(?:塞|递|交|送|给)你(?:一|半|块|张|把|瓶)?[一-鿿]{0,3}?[「“]([^」”\n]{2,20})[」”]/g
  while ((m = re2.exec(s))) push(m[1])
  // 交给你一只木剑 / 塞给你一块黑面包
  const re3 = /(?:塞|递|交|送|给)你(?:一|半)?[个只块张把瓶副条瓶]([一-鿿]{2,12})/g
  while ((m = re3.exec(s))) push(m[1])
  return names.slice(0, 8)
}

/**
 * 正文写了赠送但 json 漏了 → 自动补 add_items；json 有正文无的保留（以 json 为准）。
 */
export function syncGiftsWithNarrative(changes, narrative) {
  if (!changes || typeof changes !== 'object') return changes
  const gifts = extractGiftNames(narrative)
  if (!gifts.length) return changes
  const have = new Set(
    (Array.isArray(changes.add_items) ? changes.add_items : [])
      .map(x => x && x.name && String(x.name))
      .filter(Boolean)
  )
  const add = gifts
    .filter(g => ![...have].some(n => n.includes(g) || g.includes(n)))
    .map(name => ({ name, count: 1, type: 'special', desc: '剧情赠与' }))
  if (!add.length) return changes
  const list = Array.isArray(changes.add_items) ? changes.add_items.slice() : []
  for (const item of add) {
    if (list.length >= 10) break
    list.push(item)
  }
  changes.add_items = list
  return changes
}

function normRelList(list) {
  if (!Array.isArray(list)) return []
  return list.slice(0, 12).map(r => {
    if (!r) return null
    if (typeof r === 'string') return { to: String(r), rel: '相关', note: '' }
    return {
      to: String(r.to || r.name || r.target || ''),
      rel: String(r.rel || r.relation || r.type || '相关').slice(0, 12),
      note: String(r.note || r.desc || '').slice(0, 40)
    }
  }).filter(r => r && r.to)
}

function normGList(list) {
  if (!Array.isArray(list)) return []
  return list.slice(0, 8).map(g => {
    if (!g) return null
    if (typeof g === 'string') return { to: '', kind: '怨', note: String(g).slice(0, 40) }
    const kindRaw = String(g.kind || g.type || '怨')
    const kind = /恩/.test(kindRaw) ? '恩' : /仇/.test(kindRaw) ? '仇' : /债/.test(kindRaw) ? '债' : '怨'
    return {
      to: String(g.to || g.name || g.target || ''),
      kind,
      note: String(g.note || g.desc || g.reason || '').slice(0, 40)
    }
  }).filter(Boolean)
}

function mergeRelList(oldList, raw) {
  const base = Array.isArray(oldList) ? oldList.slice() : []
  const add = normRelList(raw)
  for (const r of add) {
    const i = base.findIndex(x => x.to === r.to)
    if (i >= 0) base[i] = r
    else base.push(r)
  }
  return base.slice(0, 12)
}

function mergeGList(oldList, raw) {
  const base = Array.isArray(oldList) ? oldList.slice() : []
  const add = normGList(raw)
  for (const g of add) {
    const i = base.findIndex(x => x.to === g.to && x.kind === g.kind)
    if (i >= 0) base[i] = g
    else base.push(g)
  }
  return base.slice(0, 8)
}
