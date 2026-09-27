// 委托/任务：接取 → 推进 → 完成（开放世界，不设强制时限）
// 状态：active（进行中）/ done（已完成）/ failed（主动失败/放弃）

export const QUEST_STATUS = ['active', 'done', 'failed']
const MAX_QUESTS = 20

export function ensureQuestList(S) {
  if (!S) return []
  if (!Array.isArray(S.quests)) S.quests = []
  return S.quests
}

function normObjectives(list) {
  if (!Array.isArray(list)) return []
  return list.slice(0, 6).map(o => String(o).slice(0, 40)).filter(Boolean)
}

function normQuest(raw, S) {
  if (!raw || typeof raw !== 'object') return null
  const title = String(raw.title || raw.name || '').trim().slice(0, 40)
  if (!title) return null
  let status = String(raw.status || 'active').toLowerCase()
  if (status === 'completed' || status === 'complete' || status === '完成') status = 'done'
  else if (status === '失败' || status === 'abandoned') status = 'failed'
  else if (status === '接受' || status === 'accepted' || status === '进行中' || status === 'in_progress') status = 'active'
  else if (!QUEST_STATUS.includes(status)) status = ''

  return {
    id: String(raw.id || ('q_' + Math.abs(hash(title + (raw.from || '') + (raw.loc || ''))) + '_' + Date.now().toString(36).slice(-3))).slice(0, 40),
    title,
    desc: String(raw.desc || '').slice(0, 120),
    from: String(raw.from || '').slice(0, 24),
    loc: String(raw.loc || raw.location || raw.place || '').slice(0, 32),
    status: status || 'active',
    objectives: normObjectives(raw.objectives || raw.goals),
    reward: String(raw.reward || '').slice(0, 60),
    notes: String(raw.notes || raw.note || '').slice(0, 80),
    log: Array.isArray(raw.log) ? raw.log.slice(-6).map(x => String(x).slice(0, 60)) : []
  }
}

function hash(s) {
  let h = 0
  const x = String(s || '')
  for (let i = 0; i < x.length; i++) h = ((h << 5) - h + x.charCodeAt(i)) | 0
  return h
}

/**
 * 应用 changes.quests
 * [{ title, desc?, from?, loc?, status?, objectives?, reward?, notes?, id? }]
 */
export function applyQuestChanges(S, list) {
  const added = []
  const updated = []
  if (!Array.isArray(list) || !list.length) return { added, updated }
  const quests = ensureQuestList(S)
  for (const raw of list.slice(0, 8)) {
    const q = normQuest(raw, S)
    if (!q) continue
    const idx = quests.findIndex(x =>
      (q.id && x.id === q.id) || (x.title === q.title && (!raw.id || x.id === q.id))
    )
    if (idx < 0) {
      if (quests.length >= MAX_QUESTS) {
        const drop = quests.findIndex(x => x.status === 'failed') >= 0 ? quests.findIndex(x => x.status === 'failed') : quests.findIndex(x => x.status !== 'active')
        if (drop >= 0) quests.splice(drop, 1)
        else continue
      }
      quests.push(q)
      added.push(q.title)
    } else {
      const old = quests[idx]
      quests[idx] = {
        id: old.id,
        title: q.title || old.title,
        desc: q.desc || old.desc,
        from: q.from || old.from,
        loc: q.loc || old.loc || '',
        // 未提供 status 或非法 status 时保留旧状态，避免 done 被重置
        status: (raw.status && q.status) ? q.status : old.status,
        objectives: q.objectives.length ? q.objectives : old.objectives,
        reward: q.reward || old.reward,
        notes: q.notes || old.notes,
        log: [...(old.log || []), ...(q.log || [])].slice(-6)
      }
      if (raw.status && old.status !== quests[idx].status) {
        updated.push(quests[idx].title + '→' + quests[idx].status)
      } else {
        updated.push(quests[idx].title)
      }
    }
  }
  return { added, updated }
}

/** 地图任务点：active 委托对准 loc / 委托人所在地 */
export function questMarkers(S) {
  const quests = ensureQuestList(S).filter(q => q.status === 'active')
  const byLoc = new Map()
  for (const q of quests) {
    const names = []
    if (q.loc) names.push(q.loc)
    if (q.from) {
      for (const l of S.map || []) {
        if ((l.people || []).some(p => p && p.name === q.from)) names.push(l.name)
      }
    }
    for (const n of names) {
      if (!byLoc.has(n)) byLoc.set(n, [])
      byLoc.get(n).push(q.title)
    }
  }
  return byLoc
}

export function questStatusLabel(status) {
  if (status === 'done') return '已完成'
  if (status === 'failed') return '失败'
  return '进行中'
}
