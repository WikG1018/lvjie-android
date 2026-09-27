// 人物名单收集 + NPC 种子简报
import { collectCharacterNames, npcSeedsToBrief } from '../app/js/engine/book-ingest.js'

const facts = [
  { characters: [{ name: '克莱恩', role: '主角' }, { name: '奥黛丽', role: '配角' }, '克莱恩'] },
  { characters: [{ name: '阿尔杰', role: '同伴' }] }
]
const names = collectCharacterNames(facts, { characters: [{ name: '愚者' }] })
console.log('names', names.join(','))
if (names.length < 3) throw new Error('collect names')
const brief = npcSeedsToBrief([
  { name: '克莱恩', realm: '序列五', power: 80, intro: '主角', gender: '男', home: '酒馆', is_companion: true },
  { name: 'x' }
])
if (!brief.includes('克莱恩')) throw new Error('brief')
console.log('CHAR_OK')
