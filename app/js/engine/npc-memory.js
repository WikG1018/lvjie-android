// 按需 NPC 记忆：从存档检索命中人物，注入系统提示词
// 不做全量名册进 prompt；只在点名/当前场景时带档案

/**
 * 建索引：friends + 全图 people
 * @returns {Map<string, object>} 小写名 → 卡片
 */
export function buildNpcIndex(S) {
  const idx = new Map()
  if (!S) return idx
  const add = (name, card) => {
    const n = String(name || '').trim()
    if (!n || n.length < 2) return
    const key = n.toLowerCase()
    if (!idx.has(key)) idx.set(key, card)
  }
  for (const f of S.friends || []) {
    add(f.name, {
      kind: 'friend',
      name: f.name,
      realm: f.realm || '',
      power: f.power != null ? f.power : null,
      gender: f.gender || '',
      favor: f.favor || 0,
      married: f.married || null,
      intro: f.intro || '',
      mem: f.mem || '',
      at: friendLocName(S, f.name),
      relations: normRelations(f.relations),
      grudges: normGrudges(f.grudges),
      recent: Array.isArray(f.history) ? f.history.slice(-4) : []
    })
  }
  for (const loc of S.map || []) {
    for (const p of loc.people || []) {
      if (!p || !p.name) continue
      add(p.name, {
        kind: 'scene_npc',
        name: p.name,
        realm: p.realm || '',
        power: p.power != null ? p.power : null,
        gender: p.gender || '',
        intro: p.intro || '',
        at: loc.name,
        world: loc.world || '',
        favor: null,
        mem: '',
        relations: normRelations(p.relations),
        grudges: normGrudges(p.grudges),
        recent: []
      })
    }
    for (const b of loc.beasts || []) {
      if (!b || !b.name) continue
      add(b.name, {
        kind: 'beast',
        name: b.name,
        realm: b.realm || '',
        power: b.power != null ? b.power : null,
        intro: b.drops ? `掉落：${b.drops}` : '',
        at: loc.name,
        world: loc.world || '',
        favor: null,
        mem: '',
        recent: []
      })
    }
  }
  return idx
}

function friendLocName(S, name) {
  for (const l of S.map || []) {
    if ((l.people || []).some(p => p && p.name === name)) return l.name
  }
  return null
}

/** 关系网：[{ to, rel, note }] */
export function normRelations(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const r of list) {
    if (!r) continue
    if (typeof r === 'string') {
      out.push({ to: r, rel: '相关', note: '' })
      continue
    }
    const to = String(r.to || r.name || r.target || '').trim()
    if (!to) continue
    out.push({
      to,
      rel: String(r.rel || r.relation || r.type || '相关').slice(0, 12),
      note: String(r.note || r.desc || '').slice(0, 40)
    })
    if (out.length >= 12) break
  }
  return out
}

/** 恩怨：[{ to, kind: 恩|怨|仇|债, note }] */
export function normGrudges(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const g of list) {
    if (!g) continue
    if (typeof g === 'string') {
      out.push({ to: '', kind: '怨', note: g.slice(0, 40) })
      continue
    }
    const kindRaw = String(g.kind || g.type || g.grudge || '怨')
    const kind = /恩/.test(kindRaw) ? '恩' : /仇/.test(kindRaw) ? '仇' : /债/.test(kindRaw) ? '债' : '怨'
    out.push({
      to: String(g.to || g.name || g.target || '').trim(),
      kind,
      note: String(g.note || g.desc || g.reason || '').slice(0, 40)
    })
    if (out.length >= 8) break
  }
  return out
}

/** 反向同步：A 挂了对 B 的关系时，B 若可知则补一条回指 */
export function syncReverseRelations(S, name, relations, grudges) {
  if (!S || !name) return
  const targetName = String(name)
  const upsert = (list, item, max) => {
    const arr = Array.isArray(list) ? list.slice() : []
    const kindKey = item.kind || ''
    const relKey = item.rel || ''
    const i = arr.findIndex(x => {
      if (!x || x.to !== item.to) return false
      return (x.kind || '') === kindKey && (x.rel || '') === relKey
    })
    if (i >= 0) arr[i] = Object.assign({}, arr[i], item)
    else arr.push(item)
    return arr.slice(0, max)
  }

  const applyToFriend = (friendName, rel, grd) => {
    const f = (S.friends || []).find(x => x.name === friendName)
    if (!f) return false
    if (rel) f.relations = upsert(f.relations, rel, 12)
    if (grd) f.grudges = upsert(f.grudges, grd, 8)
    return true
  }

  for (const r of relations || []) {
    if (!r || !r.to || r.to === targetName) continue
    const rel = { to: targetName, rel: r.rel || '相关', note: r.note || '' }
    if (!applyToFriend(r.to, rel, null)) {
      // 场景 NPC 可能也认识
      for (const loc of S.map || []) {
        const p = (loc.people || []).find(x => x.name === r.to)
        if (p) {
          p.relations = upsert(p.relations, rel, 12)
          break
        }
      }
    }
  }
  for (const g of grudges || []) {
    if (!g || !g.to || g.to === targetName) continue
    const kind = g.kind || '怨'
    // 恩怨不对称：怨/仇 对方记反向（怨则对方也怨上你；恩则对方记恩）
    const backKind = kind === '恩' ? '恩' : kind === '债' ? '债' : '怨'
    const grd = { to: targetName, kind: backKind, note: g.note || '' }
    if (!applyToFriend(g.to, null, grd)) {
      for (const loc of S.map || []) {
        const p = (loc.people || []).find(x => x.name === g.to)
        if (p) {
          p.grudges = upsert(p.grudges, grd, 8)
          break
        }
      }
    }
  }
}

/** 界面用：某人的关系摘要行 */
export function relationLines(card) {
  const lines = []
  for (const r of (card && card.relations) || []) {
    if (!r) continue
    lines.push(`🤝 ${r.to} · ${r.rel || '相关'}${r.note ? ' — ' + r.note : ''}`)
  }
  for (const g of (card && card.grudges) || []) {
    if (!g) continue
    const icon = g.kind === '恩' ? '💚' : g.kind === '债' ? '📜' : g.kind === '仇' ? '⚔️' : '⚡'
    lines.push(`${icon} ${g.to || '（未指名）'} · ${g.kind || '怨'}${g.note ? ' — ' + g.note : ''}`)
  }
  return lines
}

/** 文本里挑出已知名字（长名优先，避免短名误匹配） */
export function matchNpcNames(text, index) {
  const s = String(text || '')
  if (!s || !index || !index.size) return []
  const hits = []
  const keys = [...index.keys()].sort((a, b) => b.length - a.length)
  let rest = s
  for (const key of keys) {
    const name = index.get(key).name
    if (!name) continue
    if (rest.includes(name) || rest.toLowerCase().includes(key)) {
      hits.push(name)
      // 去掉已命中片段，减少「张小明」吃掉「张三」类干扰
      rest = rest.split(name).join(' ')
    }
    if (hits.length >= 8) break
  }
  return hits
}

/** 把命中卡片压成提示词块 */
export function focusNpcBlock(index, names) {
  const list = []
  for (const n of names || []) {
    const card = index.get(String(n || '').toLowerCase())
    if (card && !list.some(x => x.name === card.name)) list.push(card)
    if (list.length >= 8) break
  }
  if (!list.length) return ''
  return `【相关人物档案】（按需注入，说话做事要与这些人设一致）
${list.map(c => {
    const bits = []
    bits.push(`- ${c.name}`)
    if (c.realm) bits.push(`档位：${c.realm}`)
    if (c.power != null) bits.push(`战力：${c.power}`)
    if (c.gender) bits.push(`性别：${c.gender}`)
    if (c.favor != null) bits.push(`好感：${c.favor}`)
    if (c.married) bits.push('关系：伴侣')
    if (c.at) bits.push(`出没：${c.at}`)
    if (c.intro) bits.push(`人设：${c.intro}`)
    if (c.mem) bits.push(`长期记忆：${c.mem}`)
    if (c.relations && c.relations.length) {
      bits.push('关系网：' + c.relations.map(r => `${r.to}（${r.rel}${r.note ? '·' + r.note : ''}）`).join('、'))
    }
    if (c.grudges && c.grudges.length) {
      bits.push('恩怨：' + c.grudges.map(g => `${g.to ? g.to + '·' : ''}${g.kind}${g.note ? '·' + g.note : ''}`).join('、'))
    }
    if (c.recent && c.recent.length) {
      bits.push(`近况：${c.recent.map(h => typeof h === 'string' ? h : (h && h.text) || '').filter(Boolean).join('；')}`)
    }
    return bits.join(' · ')
  }).join('\n')}`
}

/**
 * 生成提示词用：当前场景人 + 点名命中
 * @param {object} S 存档
 * @param {string[]} texts 用于扫名字的文本（玩家输入/事件目标等）
 */
export function npcFocusFromTexts(S, texts) {
  const index = buildNpcIndex(S)
  const blob = (texts || []).filter(Boolean).join('\n')
  const names = matchNpcNames(blob, index)
  // 当前场景 people 本身已在 locState；这里只补「不在现场但被点名」的
  const cur = curPeopleNames(S)
  const focusNames = names.filter(n => !cur.includes(n))
  const block = focusNpcBlock(index, names) // 全量命中（含现场，档案更完整）
  return { index, names, focusNames, block }
}

function curPeopleNames(S) {
  const loc = (S && S.map && S.map.find(l => l.id === S.currentLoc)) || (S && S.map && S.map[0])
  return ((loc && loc.people) || []).map(p => p && p.name).filter(Boolean)
}


export const REL_TYPES = ['熟人', '伙伴', '恩师', '弟子', '仇人', '挚友']

export function normalizeRelType(x) {
  const s = String(x || '')
  if (REL_TYPES.includes(s)) return s
  if (/师|师尊|恩师/.test(s)) return '恩师'
  if (/徒|弟子/.test(s)) return '弟子'
  if (/仇|敌|恨/.test(s)) return '仇人'
  if (/挚|密友|爱人/.test(s)) return '挚友'
  if (/伙|同伴|队友/.test(s)) return '伙伴'
  return '熟人'
}
