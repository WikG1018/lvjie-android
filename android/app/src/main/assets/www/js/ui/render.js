// 各 Tab 渲染
import { esc, fmtNum, ageLabelShort } from '../engine/util.js'
import {
  tierLabel, tierColor, playerCultReq, isLifeExpired
} from '../engine/progression.js'
import { totalPowerF, powerBreakdown, consumableEffect } from '../engine/power.js'
import { curLoc, travel, gateReason, travelDays } from '../engine/map.js'
import { skillLabel } from '../engine/skills.js'
import { addItem, normalizeType, typeName, itemChip, useDirectItem } from '../engine/inventory.js'
import { toggleEquip, equipSummary, ensureEquipFlags } from '../engine/equip.js'
import { packUi, packFeatures, sceneActionsOf } from '../engine/pack-ui.js'
import { sanitizeManualData, manualDesc, forgetOldTechniques } from '../engine/techniques.js'
import { relationLines } from '../engine/npc-memory.js'
import { questMarkers, questStatusLabel } from '../engine/quests.js'
import { propose, divorce, canPropose, marriageEnabled, proposeWord, divorceWord, spouseLabel, PROPOSE_MIN_FAVOR, addGrudge, removeGrudge } from '../engine/marriage.js'

function favorColor(v) {
  const n = Number(v) || 0
  if (n < 0) return 'var(--red)'
  if (n >= 80) return 'var(--gold, #e8c46a)'
  return 'inherit'
}

function relBlock(person) {
  const lines = relationLines(person)
  if (!lines.length) return ''
  return '<div class="cdim">' + lines.map(l => esc(l)).join('<br>') + '</div>'
}
import { AI_STYLES, AI_STYLE_ORDER, PLAYER_GENDERS, MAX_TALK_PER_DAY, LANGUAGE_OPTIONS } from '../engine/constants.js'
import { allBgmTracks, addLocalBgmFiles, removeLocalBgm, playBgm } from './bgm.js'
import { runEventTurn, endEvent } from '../engine/event.js'
import { openModal, closeModal } from './modals.js'
import { t, uiLangName } from '../engine/i18n.js'
import { openHelp } from './settings-panels.js'

export function renderScene(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  const loc = curLoc(S) || { name: t('unknown'), world: '', continent: '', type: '', desc: '', people: [], shop: [], beasts: [], interactables: [], notes: [] }
  const EV = app.EV

  let evHtml = ''
  if (EV) {
    if (EV.loading && !EV.resultText) {
      evHtml = `<div class="ev-box"><div class="ev-head"><span>${t('evGenerating')}</span><span class="loading-dot">●●●</span></div>
        <div class="ev-text">${t('loading')}</div></div>`
    } else if (EV.resultText) {
      const opts = (EV.options || []).map((o, i) =>
        `<button class="btn ev-opt" data-opt="${i}" type="button">${i + 1}. ${esc(o)}</button>`
      ).join('')
      evHtml = `
        <div class="ev-box">
          <div class="ev-head">
            <span>${esc(EV.kind || t('evKind'))} · ${t('roundN')} ${EV.count} ${t('round')}</span>
            <span><button class="btn btn-sm" id="ev-end" type="button">${t('endEvent')}</button></span>
          </div>
          <div class="ev-text">${esc(EV.resultText)}</div>
          ${EV.error ? `<div class="ev-head" style="color:var(--red);margin-top:8px">${esc(EV.error)}</div>` : ''}
          ${EV.loading ? `<div class="ev-text loading-dot" style="margin-top:8px">${t('gen')}</div>` : opts}
          ${!EV.loading && (!EV.options || !EV.options.length) ? `<div class="btn-row"><button class="btn" id="ev-close" type="button">${t('close')}</button></div>` : ''}
          <div class="ev-input-row">
            <div class="ev-label-row"><span style="color:var(--dim);font-size:12px">${t('freeAction')}</span></div>
            <input class="ev-input" id="ev-free" type="text" placeholder="${t('freePlaceholder')}" ${EV.loading ? 'disabled' : ''}>
            <div class="btn-row"><button class="btn btn-gold btn-sm" id="ev-send" type="button" ${EV.loading ? 'disabled' : ''}>${t('send')}</button></div>
          </div>
          <div class="ai-note">${t('aiNote')}</div>
        </div>`
    } else if (EV.error) {
      evHtml = `<div class="ev-box"><div class="ev-head" style="color:var(--red)">${esc(EV.error)}</div>
        <div class="btn-row">
          <button class="btn" id="ev-retry" type="button">${t('retry')}</button>
          <button class="btn" id="ev-close" type="button">${t('close')}</button>
        </div></div>`
    }
  }

  const ui = packUi(pack)
  const feat = packFeatures(pack)
  const actions = sceneActionsOf(pack)

  main.innerHTML = `
    <div class="panel">
      <div class="loc-head">
        <span class="loc-name">${esc(loc.name)}</span>
        <span class="loc-meta">${esc(loc.world)} · ${esc(loc.continent)} · ${esc(loc.type)}</span>
      </div>
      <div class="loc-desc">${esc(loc.desc || '')}</div>
      ${(loc.notes || []).slice(-3).map(n => `<div class="loc-note">※ ${esc(n)}</div>`).join('')}
      <div class="btn-row">
        ${actions.map(a => `<button class="btn" data-act="${esc(a.id)}" type="button">${esc(a.label)}</button>`).join('')}
      </div>
    </div>
    ${evHtml}
    <div class="panel">
      <h3>${t('peopleHere')}</h3>
      <div class="grid">
        ${(loc.people || []).map(p => `
          <div class="card">
            <div class="cname"><button class="btn btn-sm" data-npcinfo="${esc(p.name)}" type="button" style="background:transparent;border:0;padding:0;color:inherit;font:inherit;cursor:pointer">${esc(p.name)}</button></div>
            <div class="crealm">${esc(p.realm || p.rank || '')}</div>
            <div class="cdesc">${esc(p.intro || '')}</div>
            ${p.gender ? `<div class="cdim">${t('genderPrefix')}${esc(p.gender)}</div>` : ''}
            ${relBlock(p)}
            <div class="cbtn"><button class="btn btn-sm" data-talk="${esc(p.name)}" type="button">${esc(pack.ui && pack.ui.talkBtn || t('talkBtn'))}</button></div>
          </div>
        `).join('') || `<div class="empty">${t('noPeople')}</div>`}
      </div>
    </div>
    <div class="panel">
      <h3>${t('threats')}</h3>
      <div class="grid">
        ${(loc.beasts || []).map(b => `
          <div class="card">
            <div class="cname">${esc(b.name)}</div>
            <div class="crealm">${esc(b.realm || '')} · ${esc(ui.powerLabel)} ${fmtNum(b.power || 0)}</div>
            <div class="cdim">${t('drops')}${esc(b.drops || t('none'))}</div>
            <div class="cbtn"><button class="btn btn-sm btn-danger" data-hunt="${esc(b.name)}" type="button">${esc(pack.ui && pack.ui.fightBtn || t('fightBtn'))}</button></div>
          </div>
        `).join('') || `<div class="empty">${t('noThreats')}</div>`}
      </div>
    </div>
    ${(loc.shop || []).length ? `
    <div class="panel">
      <h3>${t('tradeHere')}</h3>
      ${(loc.shop || []).map((it, idx) => `
        <div class="shop-row">
          <span class="sname">${esc(it.name)}</span>
          <span class="sdesc">${esc(it.desc || '')}</span>
          <span class="ctype">${esc(typeName(S, it.type, pack))}</span>
          <span class="sprice">${fmtNum(it.price || 0)} ${esc(pack.lexicon.money.main)}</span>
          <button class="btn btn-sm" data-buy="${idx}" type="button">${t('buy')}</button>
        </div>
      `).join('')}
    </div>` : ''}
    ${(loc.interactables || []).length ? `
    <div class="panel">
      <h3>${t('interact')}</h3>
      ${(loc.interactables || []).map((x, i) => `
        <div class="shop-row">
          <span class="sname">${esc(x.name)}</span>
          <span class="sdesc">${esc(x.intro || '')}</span>
          <button class="btn btn-sm" data-inter="${i}" type="button">${t('view')}</button>
        </div>
      `).join('')}
    </div>` : ''}
  `

  const ACT_PROMPTS = {}
  actions.forEach(a => { ACT_PROMPTS[a.id] = a.prompt || a.label })

  main.querySelectorAll('[data-act]').forEach(b => {
    b.onclick = () => contEvent(app, api, ACT_PROMPTS[b.dataset.act] || b.textContent)
  })
  main.querySelectorAll('[data-talk]').forEach(b => {
    b.onclick = () => contEvent(app, api, t('youSaid') + b.dataset.talk + t('youSaidTalk'))
  })
  main.querySelectorAll('[data-hunt]').forEach(b => {
    b.onclick = () => contEvent(app, api, t('youChallenge') + b.dataset.hunt + t('youChallenge2'))
  })
  main.querySelectorAll('[data-inter]').forEach(b => {
    b.onclick = () => {
      const x = loc.interactables[Number(b.dataset.inter)]
      contEvent(app, api, t('youView') + x.name + t('youView2') + (x.intro || ''))
    }
  })
  main.querySelectorAll('[data-buy]').forEach(b => {
    b.onclick = () => {
      const it = loc.shop[Number(b.dataset.buy)]
      if (S.money.main < (it.price || 0)) {
        api.toast(pack.lexicon.money.main + t('notEnough'))
        return
      }
      S.money.main -= it.price || 0
      addItem(S, it, 1)
      api.save()
      api.toast(`${t('bought')} ${it.name}`)
      api.refreshAll()
    }
  })

  main.querySelectorAll('[data-opt]').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.opt)
      const label = (app.EV.options || [])[i]
      if (label != null) contEvent(app, api, label)
    }
  })
  const send = document.getElementById('ev-send')
  const free = document.getElementById('ev-free')
  if (send && free) {
    const doSend = () => {
      const v = free.value.trim()
      if (!v) return
      contEvent(app, api, v)
    }
    send.onclick = doSend
    free.onkeydown = e => { if (e.key === 'Enter') doSend() }
  }
  const endB = document.getElementById('ev-end')
  const closeB = document.getElementById('ev-close')
  const retryB = document.getElementById('ev-retry')
  const finish = () => { endEvent(app.EV); app.EV = null; api.refreshAll() }
  if (endB) endB.onclick = finish
  if (closeB) closeB.onclick = finish
  if (retryB) retryB.onclick = () => {
    const last = [...(app.EV.history || [])].reverse().find(m => m.role === 'user')
    const text = last ? last.content : t('contStory')
    app.EV.error = ''
    contEvent(app, api, text, true)
  }
}

function contEvent(app, api, content, isRetry) {
  if (!app.EV || app.EV.ended || isRetry) {
    if (app.EV && isRetry) {
      // keep history, just re-run
      const ev = app.EV
      ev.loading = true
      ev.error = ''
      runEventTurn(app.S, ev, content, {
        limitOn: app.S.dialogLimit,
        cheatUnlocked: app.cheatUnlocked,
        onState: () => {
          if (app.EV !== ev) return
          const box = main.querySelector('.ev-text')
          if (box && ev.resultText) {
            box.textContent = ev.resultText
            return
          }
          api.refreshAll()
        },
        onDone: (e, brief) => {
          api.save()
          if (brief && brief.major && brief.major.length) api.toastHtml(brief.major.map(m => '⭐ ' + esc(m)).join('<br>'))
          api.refreshAll()
        }
      })
      api.refreshAll()
      return
    }
    api.startFlow(t('freeActionFlow'), content)
    return
  }
  // 继续当前事件
  const ev = app.EV
  runEventTurn(app.S, ev, content, {
    limitOn: app.S.dialogLimit,
    cheatUnlocked: app.cheatUnlocked,
    onState: () => {
      if (app.EV !== ev) return
      const box = main.querySelector('.ev-text')
      if (box && ev.resultText) {
        box.textContent = ev.resultText
        return
      }
      api.refreshAll()
    },
    onDone: (e, brief) => {
      api.save()
      if (brief && brief.major && brief.major.length) api.toastHtml(brief.major.map(m => '⭐ ' + esc(m)).join('<br>'))
      else if (brief && brief.minor && brief.minor.length) api.toastHtml(brief.minor.slice(0, 4).map(esc).join(' · '))
      api.refreshAll()
    }
  })
  ev.loading = true
  api.refreshAll()
}

export function renderMap(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  const markers = questMarkers(S)
  const worlds = pack.worlds || []
  const byWorld = {}
  for (const l of S.map) {
    const w = l.world || t('mainWorld')
    byWorld[w] = byWorld[w] || {}
    const c = l.continent || t('unknownPlace')
    byWorld[w][c] = byWorld[w][c] || []
    byWorld[w][c].push(l)
  }

  main.innerHTML = `
    <div class="panel">
      <h3>${esc(pack.lexicon.nav.map)}</h3>
      <div class="loc-desc">${t('at')}<b style="color:var(--accent)">${esc((curLoc(S) || {}).name || '')}</b></div>
      ${worlds.map(w => `
        <div class="world-sec">
          <div class="world-title map-h" data-w="${esc(w)}"><span>${esc(w)}</span><span class="tag map-caret">▾</span></div>
          <div class="map-body" data-wbody="${esc(w)}">
            ${Object.keys(byWorld[w] || {}).map(cont => `
              <div class="cont-title">${esc(cont)}</div>
              ${(byWorld[w][cont] || []).map(l => {
                const cur = l.id === S.currentLoc
                const gate = gateReason(S, curLoc(S) || {}, l)
                const days = travelDays(S, curLoc(S) || {}, l)
                return `
                  <div class="card loc-card ${cur ? 'cur' : ''}" style="margin-bottom:8px">
                    <div class="linfo">
                      <div class="cname">${esc(l.name)} ${cur ? t('hereMark') : ''}${markers.get(l.name) ? ' <span class="ctype">' + t('questMark') + '</span>' : ''}</div>
                      <div class="cdim">${esc(l.type)} · ${cur ? t('here') : t('aboutDays') + days + t('days')}${markers.get(l.name) ? ' · ' + esc(markers.get(l.name).join('、')) : ''}</div>
                      <div class="cdesc">${esc(l.desc || '')}</div>
                      ${gate ? `<div class="lock">🔒 ${esc(gate)}</div>` : ''}
                    </div>
                    ${cur ? '' : `<button class="btn btn-sm" data-go="${esc(l.name)}" type="button" ${gate ? 'disabled' : ''}>${t('go')}</button>`}
                  </div>
                `
              }).join('')}
            `).join('') || `<div class="empty">${t('noLocs')}</div>`}
          </div>
        </div>
      `).join('')}
    </div>
  `

  main.querySelectorAll('.map-h').forEach(h => {
    h.onclick = () => {
      const body = main.querySelector(`[data-wbody="${CSS.escape(h.dataset.w)}"]`)
      if (body) {
        body.classList.toggle('hide')
        const car = h.querySelector('.map-caret')
        if (car) car.textContent = body.classList.contains('hide') ? '▸' : '▾'
      }
    }
  })
  main.querySelectorAll('[data-go]').forEach(b => {
    b.onclick = () => {
      const r = travel(S, b.dataset.go)
      if (!r.ok) { api.toast(r.msg); return }
      if (app.EV) { endEvent(app.EV); app.EV = null }
      api.save()
      api.centerToast(r.msg)
      api.refreshAll()
      api.setTab('scene')
    }
  })
}

export function renderProfile(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  const bd = powerBreakdown(S)
  const req = playerCultReq(S)
  const ui = packUi(pack)

  main.innerHTML = `
    <div class="panel">
      <h3>${esc(pack.lexicon.nav.profile)}</h3>
      <div class="pname" style="font-family:STKaiti,KaiTi,serif;font-size:22px;color:var(--accent)">${esc(S.name)}</div>
      <div class="row" style="display:flex;justify-content:space-between;margin-top:8px">
        <span style="color:var(--dim)">${esc(pack.lexicon.level)}</span>
        <b style="color:${tierColor(S, S.tierIndex)}">${esc(tierLabel(S))}</b>
      </div>
      <div class="row" style="display:flex;justify-content:space-between">
        <span style="color:var(--dim)">${esc(pack.lexicon.progress)}</span>
        <b>${fmtNum(S.progress)} / ${fmtNum(req)}</b>
      </div>
      <div class="row" style="display:flex;justify-content:space-between">
        <span style="color:var(--dim)">${t('age')}</span><b>${ageLabelShort(S.ageDays)}</b>
      </div>
      <div class="row" style="display:flex;justify-content:space-between">
        <span style="color:var(--dim)">${esc(ui.powerLabel)}</span><b>${fmtNum(totalPowerF(S))}</b>
      </div>
      <div class="row" style="display:flex;justify-content:space-between">
        <span style="color:var(--dim)">${t('rep')}</span><b>${fmtNum(S.factionRep || 0)}</b>
      </div>
      <h4>${esc(ui.powerLabel)}${t('breakdown')}</h4>
      <div class="skill-row"><span class="k">${t('base')}</span><span class="v">${fmtNum(bd.base)}</span></div>
      <div class="skill-row"><span class="k">${t('equip')}</span><span class="v">${fmtNum(bd.art)}</span></div>
      <div class="skill-row"><span class="k">${esc(pack.lexicon.technique)}</span><span class="v">${fmtNum(bd.manual)}</span></div>
      <div class="skill-row"><span class="k">${t('fromRel')}</span><span class="v">${fmtNum(bd.spouse)}</span></div>
      <h4>${t('equipped')}</h4>
      ${(() => {
        const eq = equipSummary(S)
        return eq.length
          ? eq.map(e => {
              const tname = (e.realm_index != null && pack.tiers[e.realm_index]) ? pack.tiers[e.realm_index].name : ''
              return `<div class="skill-row"><span class="k">${esc(e.name)}</span><span class="v">${esc(e.grade || '')}${tname ? ' · ' + esc(tname) : ''}</span></div>`
            }).join('')
          : `<div class="empty">${t('noEquip')}</div>`
      })()}
      <h4>${esc(pack.lexicon.skill)}</h4>
      ${(pack.skills || []).map(sk => `
        <div class="skill-row"><span class="k">${esc(sk.name)}</span><span class="v">${esc(skillLabel(S, sk, S.skills[sk.id] || 0))}</span></div>
      `).join('')}
      <h4>${esc(pack.lexicon.technique)}</h4>
      ${(S.techniques || []).length
        ? S.techniques.map(m => `<div class="skill-row"><span class="k">${esc(m.name)}</span><span class="v">${m.level}/${m.levels} · ${esc(m.grade || '')}</span></div>`).join('')
        : `<div class="empty">${t('learned')}</div>`}
      <h4>${t('tierList')}</h4>
      <div style="font-size:12px;color:var(--dim);line-height:1.8">
        ${pack.tiers.map((t, i) => `<span style="color:${i === S.tierIndex ? 'var(--accent)' : 'inherit'}">${i + 1}.${esc(t.name)}</span>`).join(' · ')}
      </div>
    </div>
  `
}

export function renderFriends(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  const cur = curLoc(S) || {}
  const feat = packFeatures(pack)
  const friendAt = (f) => {
    const hit = (S.map || []).some(l => (l.people || []).some(p => p && p.name === f.name))
    if (hit) {
      const l = (S.map || []).find(x => (x.people || []).some(p => p && p.name === f.name))
      return { name: (l && l.name) || '', here: !!(l && l.id === S.currentLoc) }
    }
    return { name: t('unknownLoc'), here: false }
  }
  main.innerHTML = `
    <div class="panel">
      <h3>${esc(pack.lexicon.nav.friends)}</h3>
      <div class="btn-row">
        <button class="btn" id="fr-new" type="button">✨ ${t('meetNew')}${esc(pack.lexicon.companion)}</button>
      </div>
      <div class="grid" style="margin-top:12px">
        ${(S.friends || []).map((f, i) => {
          const at = friendAt(f)
          return `
          <div class="card">
            <div class="cname"><button class="btn btn-sm" data-npcinfo="${esc(f.name)}" type="button" style="background:transparent;border:0;padding:0;color:inherit;font:inherit;cursor:pointer">${esc(f.name)}</button> ${f.gender ? `<span class="ctype">${esc(f.gender)}</span>` : ''}</div>
            <div class="crealm">${esc(f.realm || '')} · <span style="color:${favorColor(f.favor)}">${t('favor')} ${fmtNum(f.favor || 0)}</span>${f.relType ? ' · ' + esc(f.relType) : ''}</div>
            <div class="cdim">📍 ${esc(at.name)}${at.here ? t('curScene') : ''}</div>
            <div class="cdesc">${esc(f.intro || '')}</div>
            ${f.mem ? `<div class="cdim">${t('mem')}${esc(f.mem)}</div>` : ''}
            ${relBlock(f)}
            ${true ? `<div class="btn-row" style="margin-top:4px">
              <button class="btn btn-sm" data-grudge="${i}" type="button">${t('grudgeAdd')}</button>
              ${(f.grudges || []).length ? `<button class="btn btn-sm" data-ungudge="${i}" type="button">${t('grudgeDel')}</button>` : ''}
            </div>` : ''}
            <div class="cbtn">
              <button class="btn btn-sm ${at.here ? 'btn-gold' : ''}" data-chat="${i}" type="button" title="${at.here ? t('faceTalk') : (feat.talkRemote ? t('msg') : t('needSameScene'))}">${at.here ? t('chat') : (feat.talkRemote ? t('msg') : t('notNearby'))}</button>
              ${marriageEnabled(pack) ? (f.married
                ? `<button class="btn btn-sm" data-divorce="${i}" type="button">${esc(divorceWord(pack))}</button>`
                : (canPropose(f, S, pack) ? `<button class="btn btn-sm" data-marry="${i}" type="button">💍 ${esc(proposeWord(pack))}</button>` : '')) : ''}
              ${(packFeatures(pack).marriage !== false && f.married) ? `<span class="ctype">${esc(spouseLabel(f, pack))}</span>` : ''}
            </div>
          </div>
        `}).join('') || `<div class="empty">${t('noCompanions')}</div>`}
      </div>
      <div class="ai-note">${t('talkDaily')}${esc(pack.lexicon.companion)}${t('talkTimes')} ${MAX_TALK_PER_DAY} ${t('times')}${feat.talkRemote ? t('talkRemoteHint') : t('needSameSceneLong')}</div>
    </div>
  `
  const nb = document.getElementById('fr-new')
  if (nb) nb.onclick = () => api.startFlow(t('meetFlow'), t('youMeet') + pack.lexicon.companion + '。')
  main.querySelectorAll('[data-grudge]').forEach(b => {
    b.onclick = () => {
      const f = S.friends[Number(b.dataset.grudge)]
      if (!f) return
      openModal(`
        <h2>${t('grudgeTitle')}</h2>
        <label style="color:var(--dim);font-size:12px">${t('target')}</label>
        <input id="gr-to" value="${t('player')}">
        <label style="color:var(--dim);font-size:12px">${t('kind')}</label>
        <select id="gr-kind">
          <option value="怨">${t('grudgeKindYuan')}</option>
          <option value="恩">${t('grudgeKindEn')}</option>
          <option value="仇">${t('grudgeKindChou')}</option>
          <option value="债">${t('grudgeKindZhai')}</option>
        </select>
        <label style="color:var(--dim);font-size:12px">${t('note')}</label>
        <input id="gr-note" placeholder="${t('notePh')}">
        <div class="btn-row">
          <button class="btn btn-gold" id="gr-ok" type="button">${t('save')}</button>
          <button class="btn" data-close type="button">${t('cancel')}</button>
        </div>
      `)
      document.getElementById('gr-ok').onclick = () => {
        addGrudge(f, document.getElementById('gr-to').value || t('player'), document.getElementById('gr-kind').value, document.getElementById('gr-note').value)
        closeModal()
        api.toast(t('grudgeAdded'))
        api.save()
        api.refreshAll()
      }
    }
  })
  main.querySelectorAll('[data-ungudge]').forEach(b => {
    b.onclick = () => {
      const f = S.friends[Number(b.dataset.ungudge)]
      if (!f) return
      const list = f.grudges || []
      if (!list.length) return
      if (list.length === 1) {
        removeGrudge(f, 0)
        api.toast(t('grudgeRemoved'))
        api.save()
        api.refreshAll()
        return
      }
      openModal(`
        <h2>${t('grudgePick')}</h2>
        <div class="cbox">
          ${list.map((g, gi) => `
            <button class="btn btn-sm" data-grm="${gi}" type="button" style="display:block;width:100%;text-align:left;margin:6px 0">
              ${esc(g.kind || t('grudgeKindYuan'))} · ${esc(g.to || t('player'))} ${g.note ? '— ' + esc(g.note) : ''}
            </button>
          `).join('')}
        </div>
        <div class="btn-row"><button class="btn" data-close type="button">${t('cancel')}</button></div>
      `)
      document.querySelectorAll('[data-grm]').forEach(btn => {
        btn.onclick = () => {
          removeGrudge(f, Number(btn.dataset.grm))
          closeModal()
          api.toast(t('grudgeRemoved'))
          api.save()
          api.refreshAll()
        }
      })
    }
  })
  main.querySelectorAll('[data-npcinfo]').forEach(b => {
    b.onclick = () => {
      const name = b.dataset.npcinfo
      const friend = (S.friends || []).find(x => x.name === name)
      const loc = curLoc(S) || {}
      const person = (loc.people || []).find(x => x.name === name)
        || (S.map || []).flatMap(l => (l.people || []).map(p => ({ ...p, _at: l.name }))).find(x => x.name === name)
      const src = friend || person || {}
      const at = person && person._at ? person._at : (friend ? (friendAt(friend).name || '') : '')
      openModal(`
        <h2>${esc(name)}</h2>
        <div class="row"><span>${t('genderLabel')}</span><span class="v">${esc(src.gender || t('notSet'))}</span></div>
        <div class="row"><span>${t('rank')}</span><span class="v">${esc(src.realm || src.rank || '')}</span></div>
        <div class="row"><span>${t('power')}</span><span class="v">${fmtNum(src.power || 0)}</span></div>
        ${src.favor != null ? `<div class="row"><span>${t('favor')}</span><span class="v" style="color:${favorColor(src.favor)}">${fmtNum(src.favor)}</span></div>` : ''}
        ${src.relType ? `<div class="row"><span>${t('relation')}</span><span class="v">${esc(src.relType)}</span></div>` : ''}
        ${at ? `<div class="row"><span>${t('location')}</span><span class="v">${esc(at)}</span></div>` : ''}
        ${src.intro ? `<div class="cdesc" style="margin-top:8px">${esc(src.intro)}</div>` : ''}
        ${src.mem ? `<div class="cdim">${t('mem')}${esc(src.mem)}</div>` : ''}
        ${relBlock(src)}
        <div class="btn-row"><button class="btn" data-close type="button">${t('close')}</button></div>
      `)
    }
  })
  main.querySelectorAll('[data-marry]').forEach(b => {
    b.onclick = () => {
      const f = S.friends[Number(b.dataset.marry)]
      if (!f) return
      if (!confirm(t('confirmPropose') + ' ' + f.name + ' ' + proposeWord(pack) + t('confirmPropose2'))) return
      const res = propose(S, f, pack)
      api.toast(res.msg)
      api.save()
      api.refreshAll()
    }
  })
  main.querySelectorAll('[data-divorce]').forEach(b => {
    b.onclick = () => {
      const f = S.friends[Number(b.dataset.divorce)]
      if (!f) return
      if (!confirm(t('confirmDivorce') + ' ' + f.name + ' ' + divorceWord(pack) + t('confirmPropose2'))) return
      const res = divorce(S, f, pack)
      api.toast(res.msg)
      api.save()
      api.refreshAll()
    }
  })
  main.querySelectorAll('[data-chat]').forEach(b => {
    b.onclick = () => {
      const f = S.friends[Number(b.dataset.chat)]
      if (!f) return
      const at = friendAt(f)
      if (!at.here) {
        if (!feat.talkRemote) {
          api.toast(t('notInScene') + (cur.name || '') + t('notInScene2'))
          return
        }
        const dayKey2 = String(Math.floor(S.ageDays / 30))
        if (f.lastDay !== dayKey2) { f.lastDay = dayKey2; f.talkCount = 0 }
        if ((f.talkCount || 0) >= MAX_TALK_PER_DAY) {
          api.toast(t('talkLimit1') + f.name + t('talkLimit2'))
          return
        }
        f.talkCount = (f.talkCount || 0) + 1
        api.save()
        api.startFlow(
          t('msg'),
          t('youMsgA') + f.name + t('youMsgB') + at.name + t('youMsgC') + (f.intro || '') + t('youMsgD') + (f.mem || t('memNone')) + t('youMsgE'),
          f.name
        )
        return
      }
      const dayKey = String(Math.floor(S.ageDays / 30))
      if (f.lastDay !== dayKey) { f.lastDay = dayKey; f.talkCount = 0 }
      if ((f.talkCount || 0) >= MAX_TALK_PER_DAY) {
        api.toast(t('talkLimit1') + f.name + t('chatLimit2'))
        return
      }
      f.talkCount = (f.talkCount || 0) + 1
      api.save()
      api.startFlow(
        t('chat'),
        t('youChatA') + (cur.name || t('herePlace')) + t('youChatB') + f.name + t('youChatC') + (f.intro || '') + t('youMsgD') + (f.mem || t('memNone')),
        f.name
      )
    }
  })
}

export function renderQuests(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  const quests = S.quests || []
  const active = quests.filter(q => q.status === 'active')
  const done = quests.filter(q => q.status === 'done')
  const failed = quests.filter(q => q.status === 'failed')
  const card = (q) => `
    <div class="card" style="margin-bottom:8px">
      <div class="cname">${esc(q.title)} <span class="ctype">${questStatusLabel(q.status)}</span></div>
      ${q.from ? `<div class="crealm">${t('questGiver')}${esc(q.from)}${q.loc ? ' · 📍' + esc(q.loc) : ''}</div>` : (q.loc ? `<div class="crealm">📍 ${esc(q.loc)}</div>` : '')}
      ${q.desc ? `<div class="cdesc">${esc(q.desc)}</div>` : ''}
      ${(q.objectives || []).length ? `<div class="cdim">${t('objectives')}${q.objectives.map(o => esc(o)).join('；')}</div>` : ''}
      ${q.reward ? `<div class="cdim">${t('rewardLabel')}${esc(q.reward)}</div>` : ''}
      ${q.notes ? `<div class="cdim">${t('progressLabel')}${esc(q.notes)}</div>` : ''}
    </div>
  `
  main.innerHTML = `
    <div class="panel">
      <h3>📜 ${t('questsTitle')}</h3>
      ${active.length
        ? active.map(card).join('')
        : `<div class="empty">${t('noQuests')}</div>`}
      ${done.length ? `<h4 style="margin-top:12px">${t('doneN2')} ${done.length}</h4>` + done.map(card).join('') : ''}
      ${failed.length ? `<h4 style="margin-top:12px">${t('failedN2')} ${failed.length}</h4>` + failed.map(card).join('') : ''}
      <div class="ai-note" style="margin-top:10px">${t('questNote')}</div>
    </div>
  `
  void pack
  void api
}

export function renderBag(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  main.innerHTML = `
    <div class="panel">
      <h3>${esc(pack.lexicon.nav.bag)} <span class="tag">${S.inventory.length} ${t('typesN')}</span></h3>
      ${S.inventory.map((it, i) => {
        const type = normalizeType(it.type)
        return `
          <div class="bag-item" style="margin-bottom:8px">
            <div class="bicon">${type === 'consumable' ? '🧪' : type === 'equip' ? '🗡️' : type === 'technique' ? '📜' : type === 'material' ? '📦' : '🎁'}</div>
            <div class="bmain">
              <div class="bname">${esc(it.name)} ${itemChip(S, it, pack)} <span class="bcount">×${it.count || 1}</span></div>
              <div class="bdesc">${esc(it.desc || '')}</div>
              ${it.price != null ? `<div class="cdim">${t('value')} ${fmtNum(it.price)} ${esc(pack.lexicon.money.main)}</div>` : ''}
            </div>
            <div class="bbtns">
              ${it.usable === 'direct' ? `<button class="btn btn-sm btn-gold" data-use="${i}" type="button">${t('useBtn')}</button>` : ''}
              ${it.usable === 'ai' ? `<button class="btn btn-sm" data-useai="${i}" type="button">${t('aiBtn')}</button>` : ''}
              ${normalizeType(it.type) === 'equip' ? `<button class="btn btn-sm ${it.equipped ? 'btn-gold' : ''}" data-equip="${i}" type="button">${it.equipped ? t('unequipBtn') : t('equipBtn')}</button>` : ''}
              ${normalizeType(it.type) === 'equip' && it.equipped && (it.grade == null || it.realm_index == null) ? `<span class="ctype" title="${t('noBonusHint')}">${t('noBonus')}</span>` : ''}
              ${normalizeType(it.type) === 'technique' ? `<button class="btn btn-sm" data-learn="${i}" type="button">${t('learnBtn')}</button>` : ''}
              <button class="btn btn-sm" data-sell="${i}" type="button">${t('sellBtn')}</button>
            </div>
          </div>
        `
      }).join('') || `<div class="empty">${t('emptyBag')}</div>`}
    </div>
  `
  main.querySelectorAll('[data-equip]').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.equip)
      const it = S.inventory[i]
      if (!it) return
      ensureEquipFlags(S)
      const res = toggleEquip(S, it)
      if (res.msg) api.toast(res.msg)
      api.save()
      api.refreshAll()
    }
  })
  main.querySelectorAll('[data-use]').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.use)
      const it = S.inventory[i]
      if (!it) return
      // 优先走标准 use_effect；消耗品且带等级时给进度
      let handled = false
      if (it.use_effect) {
        const r = useDirectItem(S, it)
        if (r.ok) { api.toast(r.msg); handled = true }
      }
      if (!handled && normalizeType(it.type) === 'consumable' && it.realm_index != null) {
        const eff = consumableEffect(S, it)
        S.progress += eff
        api.toast(`${it.name}：${pack.lexicon.progress} +${fmtNum(eff)}`)
        handled = true
      }
      if (!handled) { api.toast(t('noEffect')); return }
      it.count = (it.count || 1) - 1
      if (it.count <= 0) S.inventory.splice(i, 1)
      api.save()
      api.refreshAll()
    }
  })
  main.querySelectorAll('[data-learn]').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.learn)
      const it = S.inventory[i]
      if (!it) return
      const data = sanitizeManualData(S, {
        realm_index: it.realm_index != null ? it.realm_index : S.tierIndex,
        levels: it.levels,
        level_costs: it.level_costs,
        level_powers: it.level_powers
      })
      const rec = {
        name: it.name,
        realm_index: it.realm_index != null ? it.realm_index : S.tierIndex,
        grade: it.grade || data.grade,
        levels: data.levels,
        level_costs: data.level_costs,
        level_powers: data.level_powers,
        level: 0,
        desc: manualDesc(S, {
          realm_index: it.realm_index != null ? it.realm_index : S.tierIndex,
          grade: it.grade || data.grade,
          levels: data.levels,
          level_costs: data.level_costs,
          level_powers: data.level_powers
        })
      }
      if ((S.techniques || []).some(m => m.name === rec.name && m.realm_index === rec.realm_index)) {
        api.toast(t('alreadyKnown'))
        return
      }
      S.techniques = S.techniques || []
      S.techniques.push(rec)
      forgetOldTechniques(S, t => api.toast(t))
      it.count = (it.count || 1) - 1
      if (it.count <= 0) S.inventory.splice(i, 1)
      api.toast(t('learnOkA') + rec.name + t('learnOkB'))
      api.save()
      api.refreshAll()
    }
  })
  main.querySelectorAll('[data-useai]').forEach(b => {
    b.onclick = () => {
      const it = S.inventory[Number(b.dataset.useai)]
      api.startFlow(t('useItemFlow'), t('youUse') + it.name + t('youUse2') + (it.desc || ''))
    }
  })
  main.querySelectorAll('[data-sell]').forEach(b => {
    // sell-guards

    b.onclick = () => {
      const i = Number(b.dataset.sell)
      const it = S.inventory[i]
      if (!it) return
      const gain = Math.floor((Number(it.price) || 0) * 0.5)
      if (it.equipped) {
        if (!confirm('「' + it.name + '」' + t('soldEq'))) return
      } else if (gain <= 0) {
        if (!confirm('「' + it.name + '」' + t('discardQ'))) return
      } else if (!confirm(t('sellQ1') + ' ' + it.name + t('sellQ2') + ' ' + gain + t('sellQ3'))) {
        return
      }
      S.money.main += gain
      if (it.equipped) it.equipped = false
      it.count = (it.count || 1) - 1
      if (it.count <= 0) S.inventory.splice(i, 1)
      api.toast(t('soldA') + ' ' + it.name + '，+' + fmtNum(gain) + ' ' + pack.lexicon.money.main)
      api.save()
      api.refreshAll()
    }
  })
}

export function renderSettings(app, api) {
  const S = app.S
  const pack = globalThis.__AW_PACKS__[S.worldview]
  const main = document.getElementById('main')
  main.innerHTML = `
    <div class="panel">
      <h3>${esc(pack.lexicon.nav.settings)}</h3>
      <h4>${t('storyLang')}</h4>
      <div class="btn-row">
        ${LANGUAGE_OPTIONS.map(l => `
          <button class="btn btn-sm ${(S.lang || 'zh-CN') === l.id ? 'btn-gold' : ''}" data-lang="${l.id}" type="button">${esc(uiLangName(l.id))}</button>
        `).join('')}
      </div>
      <div style="font-size:12px;color:var(--faint);margin-bottom:6px">${t('storyLangHint')}</div>

      <h4>${t('aiStyle')}</h4>
      <div class="btn-row">
        ${AI_STYLE_ORDER.map(k => `
          <button class="btn btn-sm ${S.aiStyle === k ? 'btn-gold' : ''}" data-style="${k}" type="button">${AI_STYLES[k].name}</button>
        `).join('')}
      </div>
      <div style="font-size:12px;color:var(--faint);margin-top:6px">${esc(AI_STYLES[S.aiStyle] ? AI_STYLES[S.aiStyle].desc : '')}</div>

      <h4>${t('gender')}</h4>
      <div class="btn-row">
        ${PLAYER_GENDERS.map(g => `
          <button class="btn btn-sm ${S.playerGender === g.v ? 'btn-gold' : ''}" data-gender="${g.v}" type="button">${g.name}</button>
        `).join('')}
      </div>

      <h4>${t('dialogLimit')}</h4>
      <div style="font-size:12px;color:var(--faint);margin-bottom:4px">${t('dialogLimitOn')}</div>
      <div class="btn-row">
        <button class="btn btn-sm ${S.dialogLimit ? 'btn-gold' : ''}" data-limit="1" type="button">${t('on')}</button>
        <button class="btn btn-sm ${!S.dialogLimit ? 'btn-gold' : ''}" data-limit="0" type="button">${t('off')}</button>
      </div>

      <h4>${t('bgm')}</h4>
      <div class="bgm-group-label">${t('builtin')}</div>
      <div class="btn-row">
        ${allBgmTracks().filter(t => !t.custom).map(t => `
          <button class="btn btn-sm ${(S.bgmTrack || '') === t.id ? 'btn-gold' : ''}" data-bgm="${t.id}" type="button">${esc(t.name)}${(S.bgmTrack || '') === t.id ? ' ●' : ''}</button>
        `).join('')}
      </div>
      ${allBgmTracks().some(t => t.custom) ? `
      <div class="bgm-group-label" style="margin-top:8px">${t('custom')}</div>
      <div class="btn-row">
        ${allBgmTracks().filter(t => t.custom).map(t => `
          <button class="btn btn-sm ${(S.bgmTrack || '') === t.id ? 'btn-gold' : ''}" data-bgm="${t.id}" type="button">${esc(t.name)}${(S.bgmTrack || '') === t.id ? ' ●' : ''}</button>
          <button class="btn btn-sm btn-danger" data-bgm-del="${esc(t.id)}" type="button">×</button>
        `).join('')}
      </div>` : ''}
      <div class="btn-row" style="margin-top:6px">
        <button class="btn btn-sm" id="bgm-add" type="button">➕ ${t('localMusic')}</button>
        <input id="bgm-file" type="file" accept=".mp3,.wav,.ogg,.m4a,.mid,.midi" multiple hidden>
      </div>
      <div style="font-size:12px;color:var(--faint);margin-top:4px">${t('localMusicHint')}</div>

      <h4>API</h4>
      <div class="btn-row">
        <button class="btn" id="set-key" type="button">🔑 ${t('switchApiKey')}</button>
        <button class="btn" id="set-help" type="button">📖 ${t('help')}</button>
      </div>

      <h4>${t('saves')}</h4>
      <div class="btn-row">
        <button class="btn" id="set-export" type="button">${t('exportSave')}</button>
        <button class="btn" id="set-import" type="button">${t('importSave')}</button>
        <input id="set-import-file" type="file" accept=".json,application/json" hidden>
        <button class="btn btn-danger" id="set-reset" type="button">${t('resetSave')}</button>
      </div>
      <div style="font-size:12px;color:var(--faint);margin-top:8px">
        ${t('curWorld')}${esc(pack.name)} · ${t('saveVer')} v${S.version}<br>
        ${t('keyKeepHint')}
      </div>
    </div>
  `

  main.querySelectorAll('[data-lang]').forEach(b => {
    b.onclick = () => {
      S.lang = b.dataset.lang
      api.save()
      api.refreshAll()
      try {
        if (typeof window !== 'undefined' && window.__AW_LANG__) window.__AW_LANG__(b.dataset.lang)
      } catch (e) { /* ignore */ }
    }
  })
  main.querySelectorAll('[data-style]').forEach(b => {
    b.onclick = () => { S.aiStyle = b.dataset.style; api.save(); api.refreshAll() }
  })
  main.querySelectorAll('[data-gender]').forEach(b => {
    b.onclick = () => { S.playerGender = b.dataset.gender; api.save(); api.refreshAll() }
  })
  main.querySelectorAll('[data-limit]').forEach(b => {
    b.onclick = () => { S.dialogLimit = b.dataset.limit === '1'; api.save(); api.refreshAll() }
  })
  main.querySelectorAll('[data-bgm]').forEach(b => {
    b.onclick = () => {
      S.bgmTrack = b.dataset.bgm
      playBgm(S.bgmTrack)
      api.save()
      api.refreshAll()
    }
  })
  const bgmAdd = document.getElementById('bgm-add')
  const bgmFile = document.getElementById('bgm-file')
  if (bgmAdd && bgmFile) {
    bgmAdd.onclick = () => bgmFile.click()
    bgmFile.onchange = async (e) => {
      const added = await addLocalBgmFiles(e.target.files)
      e.target.value = ''
      if (added.length) {
        api.toast(t('addedMusic') + ' ' + added.length + t('songs'))
        api.refreshAll()
      } else {
        api.toast(t('noMusicAdded'))
      }
    }
  }
  main.querySelectorAll('[data-bgm-del]').forEach(b => {
    b.onclick = async () => {
      await removeLocalBgm(b.dataset.bgmDel)
      if (S.bgmTrack === b.dataset.bgmDel) {
        S.bgmTrack = ''
        api.save()
      }
      api.refreshAll()
    }
  })
  document.getElementById('set-key').onclick = () => {
    import('./settings-panels.js').then(m => m.openKeyModal(app, { save: api.save, refreshAll: api.refreshAll }))
  }
  document.getElementById('set-help').onclick = () => openHelp(app)
  document.getElementById('set-export').onclick = () => {
    import('../engine/state.js').then(m => {
      const bundle = m.exportSaveBundle()
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'agentworlds-saves-' + Date.now() + '.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 3000)
      api.toast(t('exported'))
    })
  }
  document.getElementById('set-import').onclick = () => {
    document.getElementById('set-import-file').click()
  }
  document.getElementById('set-import-file').onchange = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bundle = JSON.parse(String(reader.result || ''))
        import('../engine/state.js').then(m => {
          const r = m.importSaveBundle(bundle)
          if (!r.ok) { api.toast(r.error || t('importFail')); return }
          api.toast(t('imported') + ' ' + r.count + t('worldSaves'))
          location.reload()
        })
      } catch (err) {
        api.toast(t('jsonFail'))
      }
    }
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }
  document.getElementById('set-reset').onclick = () => {
    openModal(`
      <h2>${t('resetTitle')}</h2>
      <div class="warn">${t('resetWarnA')}${esc(pack.name)}${t('resetWarnB')}</div>
      <div class="btn-row">
        <button class="btn" data-close type="button">${t('cancel')}</button>
        <button class="btn btn-danger" id="do-reset" type="button">${t('confirmReset')}</button>
      </div>
    `)
    document.getElementById('do-reset').onclick = () => {
      import('../engine/state.js').then(m => {
        m.resetSaveKeepMeta(S.worldview)
        location.reload()
      })
    }
  }
}
