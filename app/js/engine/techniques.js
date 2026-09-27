// 技能书 / 秘籍 / 功法（technique）
import { packOf, tierBase } from './progression.js'
import { fmtNum } from './util.js'

const MANUAL_MAX_RATIO = 2.3
const MANUAL_GRADE_STEPS = [[0.7, '粗糙'], [0.9, '平庸'], [1.1, '扎实'], [1.3, '精良'], [1.5, '出色'], [1.8, '绝学']]

export function manualRatioToGrade(r) {
  for (const [lim, g] of MANUAL_GRADE_STEPS) if (r <= lim) return g
  return '传世'
}

export function sanitizeManualData(S, raw) {
  let costs = Array.isArray(raw.level_costs)
    ? raw.level_costs.map(x => Math.max(1, Math.round(Number(x) || 1)))
    : []
  let powers = Array.isArray(raw.level_powers)
    ? raw.level_powers.map(x => Math.max(0.1, Number(x) || 0.1))
    : []
  let levels = Math.max(1, Math.min(10, Math.round(Number(raw.levels) || Math.max(costs.length, 1))))
  if (!costs.length) costs = Array(levels).fill(1)
  while (costs.length < levels) costs.push(costs[costs.length - 1])
  costs = costs.slice(0, levels)
  while (powers.length < costs.length) powers.push(1)
  powers = powers.slice(0, costs.length)

  let ratio = costs[0] > 0 ? powers[0] / costs[0] : 1
  ratio = Math.max(0.05, Math.min(MANUAL_MAX_RATIO, ratio))
  const base = tierBase(S, raw.realm_index)
  const minTotal = 0.3 * base
  const maxTotal = 1.5 * base * 1.8
  const costSum = costs.reduce((a, b) => a + b, 0)
  if (costSum * ratio > maxTotal) ratio = Math.max(0.05, maxTotal / costSum)
  else if (costSum * ratio < minTotal) ratio = Math.min(MANUAL_MAX_RATIO, minTotal / costSum)

  const level_powers = costs.map(c => Math.round(c * ratio * 100) / 100)
  return { levels, level_costs: costs, level_powers, grade: manualRatioToGrade(ratio) }
}

export function manualDesc(S, mm) {
  if (!mm || !Array.isArray(mm.level_costs)) return ''
  const pack = packOf(S)
  const unit = pack.lexicon.progress || '进度'
  const pw = (pack.lexicon.power) || '战力'
  const tech = pack.lexicon.technique || '技艺'
  const layers = mm.level_costs
    .map((c, i) => '第' + (i + 1) + '层需' + fmtNum(c) + unit + '+' + fmtNum((mm.level_powers || [])[i]) + pw)
    .join('，')
  const tname = pack.tiers[mm.realm_index] ? pack.tiers[mm.realm_index].name : ''
  return tname + '·' + (mm.grade || '') + tech + '，共' + mm.levels + '层：' + layers
}

export function makeManual(S, name, ri, level_costs, level_powers) {
  const m = sanitizeManualData(S, { realm_index: ri, level_costs, level_powers })
  const total = m.level_powers.reduce((a, b) => a + b, 0)
  return {
    name,
    desc: manualDesc(S, { realm_index: ri, grade: m.grade, levels: m.levels, level_costs: m.level_costs, level_powers: m.level_powers }),
    type: 'technique',
    realm_index: ri,
    grade: m.grade,
    levels: m.levels,
    level_costs: m.level_costs,
    level_powers: m.level_powers,
    level: 0,
    price: Math.max(1, Math.round(total * 10))
  }
}

export function forgetOldTechniques(S, addLog) {
  if (!Array.isArray(S.techniques)) return
  const pack = packOf(S)
  const tech = pack.lexicon.technique || '技艺'
  const min = S.tierIndex - 3
  const gone = S.techniques.filter(m => (m.realm_index || 0) < min)
  if (!gone.length) return
  S.techniques = S.techniques.filter(m => (m.realm_index || 0) >= min)
  gone.forEach(m => {
    if (addLog) addLog(`等级远超${tech}《${m.name}》，已自然遗忘`)
  })
}
