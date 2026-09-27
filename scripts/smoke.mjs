// 冒烟：在 Node 下加载全部模块，验证注册与开局
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const base = pathToFileURL(path.join(__dirname, '..', 'app', 'js')).href

// localStorage polyfill
const store = new Map()
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k)
}
// minimal document stub not needed for packs/engine pure imports

const { listPacks, getPack, PACKS } = await import(base + '/worldviews/index.js')
const { newGame } = await import(base + '/engine/state.js')
const { buildSystemPrompt } = await import(base + '/engine/prompt.js')
const { totalPowerF, powerBreakdown } = await import(base + '/engine/power.js')
const { tierLabel, playerCultReq, tryBreakthrough, cultReq } = await import(base + '/engine/progression.js')
const { travel, gateReason, applyNewLocations, curLoc } = await import(base + '/engine/map.js')
const { applyChanges } = await import(base + '/engine/changes.js')
const { extractGameJSON } = await import(base + '/engine/llm.js')

const packs = listPacks()
console.log('packs:', packs.map(p => p.id).join(','))
if (packs.length !== 6) throw new Error('expected 6 packs, got ' + packs.length)

for (const p of packs) {
  if (!p.tiers || !p.tiers.length) throw new Error(p.id + ' missing tiers')
  if (!p.createMap) throw new Error(p.id + ' missing createMap')
  if (!p.buildRules) throw new Error(p.id + ' missing buildRules')
  if (!p.lexicon || !p.lexicon.level) throw new Error(p.id + ' missing lexicon.level')
  if (!p.worlds || !p.worlds.length) throw new Error(p.id + ' missing worlds')

  const S = newGame('测试者', p.id)
  if (S.worldview !== p.id) throw new Error('worldview mismatch ' + p.id)
  if (!S.map.length) throw new Error(p.id + ' empty map')
  if (!S.map.some(l => l.id === S.currentLoc)) throw new Error(p.id + ' bad startLoc ' + S.startLoc)

  const sys = buildSystemPrompt(S, { limitOn: true })
  if (!sys.includes(p.lexicon.level || '等级')) throw new Error(p.id + ' prompt missing level word')
  if (sys.length < 500) throw new Error(p.id + ' prompt too short')

  const pow = totalPowerF(S)
  if (!(pow > 0)) throw new Error(p.id + ' power not positive')

  // breakthrough smoke: give progress and break
  S.progress = playerCultReq(S) + 1
  const br = tryBreakthrough(S)
  if (!br.ok) throw new Error(p.id + ' breakthrough failed: ' + br.msg)
  if (/突破/.test(br.msg) && p.id === 'urban') throw new Error('urban should not say 突破: ' + br.msg)
  if (/突破/.test(br.msg) && p.id === 'apocalypse') throw new Error('apocalypse should not say 突破: ' + br.msg)
  if (/突破/.test(br.msg) && p.id === 'wuxia') throw new Error('wuxia should not say 突破: ' + br.msg)

  // travel within start map: pick another loc if gate allows
  const other = S.map.find(l => l.id !== S.currentLoc && !gateReason(S, curLoc(S), l))
  if (other) {
    const tr = travel(S, other.name)
    if (!tr.ok) throw new Error(p.id + ' travel failed: ' + tr.msg)
  }

  // changes
  const brief = applyChanges(S, {
    ling_shi: 10,
    cultivation: 1,
    add_items: [{ name: '测试物', count: 1, desc: 'x', type: 'other', price: 1 }],
    small_events: ['测试小事'],
    new_locations: [{ name: '测试新地', world: p.worlds[0], continent: '测试洲', type: '荒野', desc: 'd', people: [], shop: [], beasts: [], interactables: [] }]
  })
  if (!brief.minor.length) throw new Error(p.id + ' changes no minor')
  if (!S.map.some(l => l.name === '测试新地')) throw new Error(p.id + ' new loc failed')

  console.log('OK', p.id, 'tier=', tierLabel(S), 'pow=', pow, 'prompt=', sys.length)
}

// JSON extract
const j = extractGameJSON('hi\n```json\n{"end":true,"changes":{}}\n```')
if (!j || j.end !== true) throw new Error('extractGameJSON failed')

// 自定义声明式世界包
const { validatePackDraft, packToDraft } = await import(base + '/engine/worldpack.js')
const { saveCustomPackDraft, loadCustomPacks, deleteCustomPack } = await import(base + '/engine/custom-packs.js')
const { sampleBookChunks } = await import(base + '/engine/book-ingest.js')
const bookText = Array.from({ length: 30 }, (_, i) => '第' + (i + 1) + '章 测试\\n正文内容。'.repeat(30)).join('\\n')
const sm = sampleBookChunks(bookText)
if (!sm.samples.length || sm.samples.length > 10) throw new Error('book sample failed')
const draft = {
  id: 'smoke-custom', name: '冒烟大陆', icon: '📘', tagline: 't', gameTitle: '冒烟之书',
  worlds: ['中土'], subNames: ['初', '中', '后'],
  lexicon: { level: '位阶', progress: '阅历', money: { main: '金币', mid: '银', high: '秘银' }, companion: '同伴', skill: '技艺', power: '战力', technique: '传承', startBtn: '启程', nav: {} },
  tiers: [{ name: '一', lifespan: 80 }, { name: '二', lifespan: 100 }, { name: '三', lifespan: 200 }, { name: '四', lifespan: 400 }, { name: '五', lifespan: 800 }],
  startLoc: 'a1',
  map: [
    { id: 'a1', name: '村', world: '中土', continent: '谷', type: '村落', desc: 'd', people: [], shop: [], beasts: [], interactables: [] },
    { id: 'a2', name: '城', world: '中土', continent: '原', type: '都城', desc: 'd', people: [], shop: [], beasts: [], interactables: [] }
  ],
  rules: ['题材为奇幻史诗', '升级动词是晋阶']
}
const dv = validatePackDraft(draft)
if (!dv.ok) throw new Error('custom pack invalid: ' + dv.errors.join(','))
globalThis.__AW_PACKS__[dv.pack.id] = dv.pack
const CS2 = newGame('自定义者', dv.pack.id)
if (CS2.worldview !== 'smoke-custom') throw new Error('custom newGame failed')
if (!CS2.map.some(l => l.id === 'a1')) throw new Error('custom map failed')
const csys = buildSystemPrompt(CS2, { limitOn: true })
if (!csys.includes('冒烟大陆') && !csys.includes('位阶')) throw new Error('custom prompt missing')
const saved = saveCustomPackDraft(draft)
if (!saved.ok) throw new Error('custom save failed')
if (!loadCustomPacks().some(p => p.id === 'smoke-custom')) throw new Error('custom list failed')
deleteCustomPack('smoke-custom')

console.log('SMOKE_PASS')
