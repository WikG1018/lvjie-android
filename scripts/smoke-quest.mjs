// 任务系统冒烟（开放世界：无超时强制失败）
import { applyQuestChanges, ensureQuestList, questStatusLabel, questMarkers } from '../app/js/engine/quests.js'

const S = {
  ageDays: 100,
  map: [{ id: 'a', name: '酒馆', people: [{ name: '李四' }] }],
  quests: []
}
let r = applyQuestChanges(S, [
  { title: '帮李四找剑', from: '李四', desc: '找回青铜剑', objectives: ['去后山'], reward: '银两', loc: '酒馆' }
])
if (!r.added.length) throw new Error('add')
r = applyQuestChanges(S, [{ title: '帮李四找剑', status: 'done', notes: '已找回' }])
if (S.quests[0].status !== 'done') throw new Error('done ' + S.quests[0].status)
if (questStatusLabel(S.quests[0].status) !== '已完成') throw new Error('label')
r = applyQuestChanges(S, [{ title: '新委托', status: 'failed' }])
if (!S.quests.some(q => q.status === 'failed')) throw new Error('failed')
if (ensureQuestList(S).length < 2) throw new Error('len')

const m = questMarkers(S)
if (!m.get('酒馆') && !m.get('酒馆')) {
  // 李四已完成任务，active 只有新委托无 loc
}
const S2 = {
  ageDays: 0,
  map: [{ id: 'a', name: '铁匠铺', people: [{ name: '王五' }] }],
  quests: []
}
applyQuestChanges(S2, [{ title: '取剑', from: '王五' }])
const m2 = questMarkers(S2)
if (!m2.get('铁匠铺') || !m2.get('铁匠铺').includes('取剑')) throw new Error('marker')
console.log('QUEST_OK')
