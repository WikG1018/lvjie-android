// 主入口：引导、欢迎页选世界观、全局状态
import { listPacks, getPack, defaultPackId, isBuiltinPack } from './worldviews/index.js'
import { loadSave, newGame, saveGame, resetSaveKeepMeta, hydratePlayerKeysFromHost, normalizePlayerKeys, listSlots, hasSave, getActiveWorld, setActiveWorld, deleteSave, applyGlobalPrefs, loadPackOrder, savePackOrder, movePackId, saveGlobalLang, getGlobalLang } from './engine/state.js'
import { LANGUAGE_OPTIONS, langPack } from './engine/constants.js'
import { t, setUiLang, getUiLang, uiLangName } from './engine/i18n.js'
import { esc, ageLabelShort, fmtNum, cssColor } from './engine/util.js'
import {
  tierLabel, tierColor, isLifeExpired, playerCultReq, tryBreakthrough
} from './engine/progression.js'
import { totalPowerF } from './engine/power.js'
import { curLoc } from './engine/map.js'
import { startEvent, runEventTurn, endEvent } from './engine/event.js'
import { applyThemeTokens } from './engine/theme.js'
import { renderScene, renderMap, renderProfile, renderFriends, renderBag, renderSettings, renderQuests } from './ui/render.js'
import { openModal, closeModal, toast, centerToast, toastHtml, centerToastHtml } from './ui/modals.js'
import { openKeyModal, openHelp } from './ui/settings-panels.js'
import { openWorldAuthor } from './ui/world-author.js'
import { initBgm, playBgm, hydrateCustomBgm, showGamePlay } from './ui/bgm.js'
import { BGM_MAP_TRACK, BGM_DEFAULT_TRACK, BGM_DEFAULT_TABS } from './engine/constants.js'
import { packUi, packFeatures } from './engine/pack-ui.js'

export const app = {
  S: null,
  TAB: 'scene',
  EV: null,
  selectedPack: defaultPackId(),
  cheatUnlocked: false,
  packMoreOpen: false
}

const RENDERS = {
  scene: renderScene,
  map: renderMap,
  profile: renderProfile,
  friends: renderFriends,
  quests: renderQuests,
  bag: renderBag,
  settings: renderSettings
}

export function getPackNow() {
  return getPack((app.S && app.S.worldview) || app.selectedPack)
}

export function save() {
  if (app.S) saveGame(app.S)
}

export function setTab(t) {
  app.TAB = t
  document.body.classList.toggle('menu', false)
  document.querySelectorAll('.navbtn').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === t)
  })
  // 主玩法页：尊重显式「无音乐」('')，否则用存档/默认曲
  try {
    if (app.S && BGM_DEFAULT_TABS.includes(t)) {
      const raw = Object.prototype.hasOwnProperty.call(app.S, 'bgmTrack') ? app.S.bgmTrack : null
      const want = raw == null ? ((t === 'map' && BGM_MAP_TRACK) || BGM_DEFAULT_TRACK) : raw
      playBgm(want)
    }
  } catch (e) { /* music optional */ }
  renderMain()
}

export function backToMenu() {
  document.body.classList.add('menu')
}

export function renderMain() {
  const fn = RENDERS[app.TAB] || renderScene
  fn(app, { save, setTab, refreshAll, openModal, closeModal, toast, centerToast, toastHtml, centerToastHtml, startFlow })
}

export function refreshAll() {
  renderHeader()
  renderPlayerCard()
  renderMain()
}

function applyTheme(pack) {
  if (!pack) return
  applyThemeTokens(pack)
  applyNavLabels(pack)
  const logo = document.getElementById('hdr-logo')
  if (logo) logo.textContent = `${pack.icon} ${pack.name} · ${t('brand')}`
  document.title = (pack.gameTitle || pack.name) +  + ' · ' + t('brand')
}

function renderHeader() {
  const pack = getPackNow()
  const S = app.S
  if (!S || !pack) return
  const money = pack.lexicon.money.main
  document.getElementById('hdr-money').textContent = fmtNum(S.money.main) + ' ' + money
  const loc = curLoc(S)
  document.getElementById('hdr-who').textContent =
    `${S.name} · ${tierLabel(S)} · ${loc ? loc.name : ''}`
}

function renderPlayerCard() {
  const pack = getPackNow()
  const S = app.S
  const el = document.getElementById('pcard')
  if (!S || !pack) { el.innerHTML = ''; return }
  const req = playerCultReq(S)
  const pct = req > 0 ? Math.min(100, (S.progress / req) * 100) : 0
  const full = pct >= 100
  const feat = packFeatures(pack)
  const ui = packUi(pack)
  const expired = feat.lifespan !== false && isLifeExpired(S)
  const money = pack.lexicon.money
  el.innerHTML = `
    <div class="pname">${esc(S.name)}</div>
    <div style="margin-top:4px">
      <span class="realmchip" style="color:${tierColor(S, S.tierIndex)};border-color:${tierColor(S, S.tierIndex)}">${esc(tierLabel(S))}</span>
      ${expired ? `<span class="lifestatus">${esc(ui.lifeWarn || t('lifeWarnDefault'))}</span>` : ''}
    </div>
    <div class="bar${full ? ' full' : ''}"><div style="width:${pct}%"></div></div>
    <div class="pgrid" style="margin-top:8px">
      <div class="row"><span class="k">${t('age')}</span><span class="v">${esc(ageLabelShort(S.ageDays))}</span></div>
      <div class="row"><span class="k">${esc(ui.powerLabel)}</span><span class="v">${fmtNum(totalPowerF(S))}</span></div>
      <div class="row"><span class="k">${esc(money.main)}</span><span class="v">${fmtNum(S.money.main)}</span></div>
      <div class="row"><span class="k">${esc(pack.lexicon.progress)}</span><span class="v">${fmtNum(S.progress)} / ${fmtNum(req)}</span></div>
    </div>
    <div class="btn-row">
      <button class="btn btn-gold btn-sm" id="btn-break" type="button" ${pct < 100 ? 'disabled' : ''}>${esc(ui.advanceBtn)}</button>
    </div>
  `
  const br = document.getElementById('btn-break')
  if (br) br.onclick = doBreakthrough
}

function doBreakthrough() {
  const pack = getPackNow()
  const ui = packUi(pack)
  const r = tryBreakthrough(app.S)
  if (!r.ok) { toast(r.msg); return }
  app.S.bigEvents.push({ age: ageLabelShort(app.S.ageDays), text: r.msg })
  save()
  centerToastHtml(esc(ui.advanceSuccessTitle || t('successDef')) + '<br><span style="font-size:22px">' + esc(r.msg) + '</span>')
  refreshAll()
}

export function startFlow(kind, content, target) {
  if (!app.S) return
  if (app.EV) {
    endEvent(app.EV)
    app.EV = null
  }
  app.EV = startEvent(kind, content, target)
  app.TAB = 'scene'
  document.body.classList.remove('menu')
  renderMain()
  const ev = app.EV
  runEventTurn(app.S, ev, content, {
    limitOn: app.S.dialogLimit,
    cheatUnlocked: app.cheatUnlocked,
    onState: () => {
      if (app.EV === ev) renderMain()
    },
    onDone: (e, brief) => {
      save()
      if (brief && brief.major && brief.major.length) {
        toastHtml(brief.major.map(m => '⭐ ' + esc(m)).join('<br>'), 4500)
      } else if (brief && brief.minor && brief.minor.length) {
        toastHtml(brief.minor.slice(0, 4).map(m => esc(m)).join(' · '))
      }
      renderHeader()
      renderPlayerCard()
    }
  })
}

/* ---------- 欢迎页 ---------- */
function setShell(mode) {
  const w = document.getElementById('welcome')
  const hdr = document.getElementById('hdr')
  const appEl = document.getElementById('app')
  if (mode === 'game') {
    w.hidden = true
    w.style.display = 'none'
    hdr.hidden = false
    hdr.style.display = ''
    appEl.hidden = false
    appEl.style.display = ''
    document.body.classList.remove('menu')
  } else {
    w.hidden = false
    w.style.display = ''
    hdr.hidden = true
    hdr.style.display = 'none'
    appEl.hidden = true
    appEl.style.display = 'none'
    document.body.classList.add('menu')
  }
}

function slotMeta(packId) {
  const hit = listSlots().find(s => s.id === packId)
  if (!hit) return null
  const pack = getPack(packId)
  try {
    // 用 progression 的展示需要 S；这里做轻量摘要
    const names = (pack && pack.subNames) || [t('subI'), t('subMid'), t('subHi')]
    const tiers = (pack && pack.tiers) || []
    const t = tiers[hit.tierIndex] || { name: '' }
    const sn = names[Math.min(hit.sub, names.length - 1)] || ''
    return { ...hit, levelText: (t.name || '') + sn }
  } catch (e) {
    return hit
  }
}

function applyUiLang(id) {
  setUiLang(id)
  applyStaticChrome()
  if (app.S) {
    app.S.lang = id
    try { save() } catch (e) { /* ignore */ }
    refreshAll()
  } else {
    renderWelcome()
  }
}

function applyStaticChrome() {
  try {
    document.documentElement.lang = getUiLang()
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt }
    set('hdr-money-label', t('money'))
    // 顶栏按钮
    const bk = document.getElementById('btn-key'); if (bk) bk.textContent = '🔑 ' + t('api')
    const bh = document.getElementById('btn-help'); if (bh) bh.textContent = '📖 ' + t('help')
    const bw = document.getElementById('btn-worlds'); if (bw) bw.textContent = '🌐 ' + t('worlds')
    // 侧栏
    set('nav-scene', '📍 ' + t('navScene'))
    set('nav-map', '🗺️ ' + t('navMap'))
    set('nav-profile', '👤 ' + t('navProfile'))
    set('nav-friends', '🤝 ' + t('navFriends'))
    set('nav-quests', '📜 ' + t('navQuests'))
    set('nav-bag', '🎒 ' + t('navBag'))
    set('nav-settings', '⚙️ ' + t('navSettings'))
    const bb = document.getElementById('backbtn'); if (bb) bb.title = t('back')
  } catch (e) { /* ignore */ }
}

function openLangModal() {
  const cur = getGlobalLang()
  openModal(`
    <h2>${t('storyLang')}</h2>
    <div class="btn-row">
      ${LANGUAGE_OPTIONS.map(l => `
        <button class="btn btn-sm ${cur === l.id ? 'btn-gold' : ''}" data-wlang="${l.id}" type="button">${esc(uiLangName(l.id))}</button>
      `).join('')}
    </div>
    <div style="font-size:12px;color:var(--faint);margin-top:10px">
      ${t('langModalHint')}
    </div>
    <div class="btn-row"><button class="btn btn-gold" data-close type="button">${t('ok')}</button></div>
  `)
  document.querySelectorAll('[data-wlang]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.wlang
      saveGlobalLang(id)
      closeModal()
      applyUiLang(id)
      toast(t('langSet') + ' ' + uiLangName(id))
    }
  })
}

function renderWelcome() {
  const root = document.getElementById('welcome')
  root.hidden = false
  root.style.display = ''
  const savedOrder = loadPackOrder()
  const all = listPacks()
  const packs = [...all].sort((a, b) => {
    const ca = isBuiltinPack(a.id) ? 1 : 0
    const cb = isBuiltinPack(b.id) ? 1 : 0
    if (ca !== cb) return ca - cb
    const ia = savedOrder.indexOf(a.id)
    const ib = savedOrder.indexOf(b.id)
    if (ia >= 0 || ib >= 0) {
      if (ia < 0) return 1
      if (ib < 0) return -1
      return ia - ib
    }
    return 0
  })
  const sel = app.selectedPack
  const filtered = packs

  const PRIMARY_N = 3
  const primary = filtered.slice(0, PRIMARY_N)
  const rest = filtered.slice(PRIMARY_N)
  const moreOpen = !!app.packMoreOpen

  const cardHtml = (p) => {
    const slot = slotMeta(p.id)
    return `
          <div class="pack-card ${p.id === sel ? 'on' : ''}" data-id="${esc(p.id)}" style="--pk:${cssColor(p.theme && p.theme.accent)};background:${cssColor((p.theme && (p.theme.cardBg || p.theme.panel)) || '')}">
            <div class="picon">${esc(p.icon)}</div>
            <div class="pname">${esc(p.name)}</div>
            <div class="ptag">${esc(p.tagline)}</div>
            <div class="pchip">${esc(p.lexicon.level)} · ${esc(p.lexicon.progress)}</div>
            <div class="pmeta">${esc((p.worlds || []).join(' / '))} · ${(p.tiers || []).length}${t('tiersN')}</div>
            <div class="psave">${slot
              ? `💾 ${esc(slot.name)} · ${esc(slot.levelText || '')}`
              : t('newJourney')}</div>
            <div class="btn-row" style="margin-top:6px">
              <button class="btn btn-sm" data-pack-up="${esc(p.id)}" type="button" title="↑">▲</button>
              <button class="btn btn-sm" data-pack-down="${esc(p.id)}" type="button" title="↓">▼</button>
            </div>
          </div>
        `
  }

  root.innerHTML = `
    <div class="wbox">
      <div class="wtitle">${esc(getPack(sel).gameTitle || getPack(sel).name || '旅界')}</div>
      <div class="wsub">${esc(getPack(sel).welcomeSub || getPack(sel).tagline || t('taglineDef'))}</div>
      <div class="wactions" style="margin-top:12px;margin-bottom:8px;flex-direction:row;justify-content:center;gap:8px">
                ${rest.length ? `<button class="btn" id="w-more" type="button">${moreOpen ? t('collapseMore') + ' ▴' : t('expandMore') + ' ' + rest.length + t('worldsCount') + ' ▾'}</button>` : ''}
      </div>
      <div id="pack-grid">
        ${primary.map(cardHtml).join('') || `<div class="empty">${t('noWorlds')}</div>`}
      </div>
      ${rest.length ? `
      <div id="pack-scroll" ${moreOpen ? '' : 'hidden'}>
        <div id="pack-grid-more">
          ${rest.map(cardHtml).join('')}
        </div>
      </div>` : ''}
      <div class="wactions">
        <div class="name-row">
          <input id="w-name" type="text" maxlength="12" placeholder="${t('namePlaceholder')}" value="">
        </div>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-gold" id="w-start" type="button">${t('start')}</button>
          <button class="btn" id="w-new" type="button" hidden>${t('newGame')}</button>
          <button class="btn" id="w-author" type="button">🛠 ${t('customWorld')}</button>
          <button class="btn" id="w-key" type="button">🔑 ${t('api')}</button>
          <button class="btn" id="w-lang" type="button">🌐 ${t('lang')}</button>
          <button class="btn" id="w-help" type="button">📖 ${t('help')}</button>
        </div>
        <div class="hint">${t('welcomeHint')}</div>
      </div>
    </div>
  `

  const startBtn = document.getElementById('w-start')
  const newBtn = document.getElementById('w-new')
  const nameEl = document.getElementById('w-name')

  function syncActions() {
    const p = getPack(app.selectedPack)
    const slot = slotMeta(app.selectedPack)
    if (slot) {
      startBtn.textContent = `${t('continue')} · ${slot.name}（${slot.levelText || ''}）`
      newBtn.hidden = false
      newBtn.textContent = t('newGame')
      nameEl.placeholder = t('namePlaceholder')
    } else {
      startBtn.textContent = (p && p.lexicon && p.lexicon.startBtn) || t('enterWorld')
      newBtn.hidden = true
      nameEl.placeholder = t('namePlaceholder2')
    }
  }

  root.querySelectorAll('.pack-card').forEach(card => {
    card.onclick = () => {
      app.selectedPack = card.dataset.id
      root.querySelectorAll('.pack-card').forEach(c => c.classList.toggle('on', c.dataset.id === app.selectedPack))
      applyTheme(getPack(app.selectedPack))
      syncActions()
      const pp = getPack(app.selectedPack)
      const tt = root.querySelector('.wtitle')
      const ts = root.querySelector('.wsub')
      if (tt) tt.textContent = pp.gameTitle || pp.name || t('brand')
      if (ts) ts.textContent = pp.welcomeSub || pp.tagline || ''
    }
  })

  function reorderSwap(id, dir) {
    const sc = document.getElementById('pack-scroll')
    const top = sc ? sc.scrollTop : 0
    const ids = [...root.querySelectorAll('.pack-card')].map(c => c.dataset.id)
    const i = ids.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    const tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp
    savePackOrder(ids)
    renderWelcome()
    const sc2 = document.getElementById('pack-scroll')
    if (sc2) sc2.scrollTop = top
  }

  root.querySelectorAll('[data-pack-up]').forEach(b => {
    b.onclick = (e) => { e.stopPropagation(); reorderSwap(b.dataset.packUp, -1) }
  })
  root.querySelectorAll('[data-pack-down]').forEach(b => {
    b.onclick = (e) => { e.stopPropagation(); reorderSwap(b.dataset.packDown, 1) }
  })

  const moreBtn = document.getElementById('w-more')
  if (moreBtn) {
    moreBtn.onclick = () => {
      app.packMoreOpen = !app.packMoreOpen
      renderWelcome()
      const btn = document.getElementById('w-more')
      if (btn) {
        try { btn.scrollIntoView({ block: 'nearest' }) } catch (e) { /* ignore */ }
      }
      // 展开后滚动区从顶部开始，避免只看到中下部
      const sc = document.getElementById('pack-scroll')
      if (sc) sc.scrollTop = 0
    }
  }


  startBtn.onclick = () => {
    const id = app.selectedPack
    if (hasSave(id)) {
      const S = loadSave(id)
      if (S) {
        setActiveWorld(id)
        showGame(S)
        toast(`${t('loadedSave')}《${getPack(id).name}》${t('saveWord')}`)
        return
      }
    }
    const name = (nameEl.value || '').trim()
    startNewGame(name, id)
  }

  newBtn.onclick = () => {
    const id = app.selectedPack
    const slot = slotMeta(id)
    openModal(`
      <h2>${t('newGameTitle')}</h2>
      <p>${t('overwriteA')}${esc(getPack(id).name)}${t('overwriteB')}${slot ? `（${esc(slot.name)} · ${esc(slot.levelText || '')}）` : ''}${t('otherKeeps')}</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn" data-close type="button">${t('cancel')}</button>
        <button class="btn btn-danger" id="w-do-new" type="button">${t('overwriteNew')}</button>
      </div>
    `)
    document.getElementById('w-do-new').onclick = () => {
      closeModal()
      deleteSave(id)
      const name = (nameEl.value || '').trim()
      startNewGame(name, id)
    }
  }

  document.getElementById('w-author').onclick = () => {
    openWorldAuthor(app, {
      onSaved: () => {
        setShell('welcome')
        renderWelcome()
      }
    })
  }
  const wk = document.getElementById('w-key')
  if (wk) wk.onclick = () => openKeyModal(app, { save, refreshAll })
  const wl = document.getElementById('w-lang')
  if (wl) wl.onclick = () => openLangModal()
  const wh = document.getElementById('w-help')
  if (wh) wh.onclick = () => openHelp(app)

  syncActions()
  applyTheme(getPack(sel))
}

function startNewGame(name, packId) {
  try {
    app.S = newGame(name, packId)
    save()
    try { playBgm(app.S.bgmTrack) } catch (e) { /* music optional */ }
    setShell('game')
    applyTheme(getPack(packId))
    refreshAll()
    firstGuide(app.S)
  } catch (e) {
    console.error(e)
    toast(t('enterFail') + (e && e.message || e))
  }
}

function showGame(S) {
  try { applyGlobalPrefs(S) } catch (e) { /* ignore */ }
  app.S = S
  app.selectedPack = S.worldview || defaultPackId()
  setShell('game')
  applyTheme(getPack(S.worldview))
  try {
    const rawBgm = Object.prototype.hasOwnProperty.call(S, 'bgmTrack') ? S.bgmTrack : null
    const track = (rawBgm === 'handpan' || rawBgm === 'universe') ? (BGM_DEFAULT_TRACK || 'm027') : (rawBgm == null ? (BGM_DEFAULT_TRACK || 'm027') : rawBgm)
    showGamePlay(S)
  } catch (e) { /* music optional */ }
  refreshAll()
}

function firstGuide(S) {
  if (S.guideDone) return
  toast(`${t('welcomeToast')}《${getPack(S.worldview).name}》${t('welcomeToast2')}`, 6000)
  S.guideDone = true
  save()
}

/* ---------- 顶栏 ---------- */
function bindHeader() {
  document.getElementById('btn-key').onclick = () => openKeyModal(app, { save, refreshAll })
  document.getElementById('btn-help').onclick = () => openHelp(app)
  document.getElementById('btn-worlds').onclick = () => {
    if (app.S) save()
    if (app.EV) { endEvent(app.EV); app.EV = null }
    app.S = null
    app.selectedPack = getActiveWorld() || (app.selectedPack) || defaultPackId()
    setShell('welcome')
    renderWelcome()
  }
  document.querySelectorAll('.navbtn').forEach(b => {
    b.onclick = () => setTab(b.dataset.tab)
  })
  document.getElementById('backbtn').onclick = backToMenu
}

function applyNavLabels(pack) {
  const nav = (pack && pack.lexicon && pack.lexicon.nav) || {}
  const map = {
    scene: nav.scene,
    map: nav.map,
    profile: nav.profile,
    friends: nav.friends,
    quests: (nav && nav.quests) || t('questsNav'),
    bag: nav.bag,
    settings: nav.settings
  }
  Object.keys(map).forEach(id => {
    const el = document.getElementById('nav-' + id)
    if (!el) return
    const icon = { scene: '📍', map: '🗺️', profile: '👤', friends: '🤝', quests: '📜', bag: '🎒', settings: '⚙️' }[id]
    if (map[id]) el.textContent = `${icon} ${map[id]}`
  })
}

function boot() {
  bindHeader()
  initBgm()
  hydrateCustomBgm().catch(() => {})
  // 先从宿主加密仓补齐 API Key，再读档/开档，避免首存把空 keys 写回
  Promise.resolve(hydratePlayerKeysFromHost()).then(kd => {
    if (kd && Array.isArray(kd.keys) && app.S) {
      if (!Array.isArray(app.S.playerKeys) || !app.S.playerKeys.length) {
        app.S.playerKeys = kd.keys
        app.S.selectedKey = typeof kd.selected === 'number' ? kd.selected : 0
        normalizePlayerKeys(app.S)
      }
    }
    startApp()
  }).catch(() => {
    startApp()
  })
}

function startApp() {
  try { setUiLang(getGlobalLang()) } catch (e) { /* ignore */ }
  applyStaticChrome()
  const existing = loadSave()
  if (existing) {
    showGame(existing)
    firstGuide(existing)
  } else {
    app.selectedPack = getActiveWorld() || defaultPackId()
    setShell('welcome')
    renderWelcome()
  }
}

window.addEventListener('beforeunload', () => {
  try { if (app.S) save() } catch (e) { /* ignore */ }
})

boot()
window.__AW_APP__ = app
window.__AW_LANG__ = applyUiLang
