// 设置面板：自定义 API Key（chat / response）
import { openModal, closeModal, toast } from './modals.js'
import { normalizeApiKey, endpointOf, maskKey, listModels } from '../engine/llm.js'
import { esc } from '../engine/util.js'
import { t } from '../engine/i18n.js'

const STYLE_HELP = {
  chat: t('styleHelpChat'),
  response: t('styleHelpResp')
}

export function openKeyModal(app, { save, refreshAll }) {
  const S = app.S
  const store = loadKeyStore()
  // S 有 keys 用 S；否则用 store。selected 两边对齐
  let selected = 0
  if (S && Array.isArray(S.playerKeys) && S.playerKeys.length && typeof S.selectedKey === 'number') {
    selected = S.selectedKey
  } else if (typeof store.selected === 'number') {
    selected = store.selected
  }
  const keys = S && Array.isArray(S.playerKeys) && S.playerKeys.length ? S.playerKeys : (store.keys || [])
  const useStandalone = !(S && Array.isArray(S.playerKeys) && S.playerKeys.length)

  const rows = keys.map((k, i) => {
    const n = normalizeApiKey(k) || k
    const style = (n.apiStyle === 'response') ? 'response' : 'chat'
    return `
      <div class="key-row">
        <label>
          <input type="radio" name="selkey" value="${i}" ${selected === i ? 'checked' : ''}>
          <b>${esc(n.name || t('cfgN') + (i + 1))}</b>
          <span class="ctype">${style === 'response' ? 'response' : 'chat'}</span>
          <span class="masktext">${esc(n.model || '')}</span>
          <span class="masktext">${(n.key || n.value) ? t('savedHidden') : t('unset')}</span>
        </label>
        <button class="btn btn-sm btn-danger" data-del="${i}" type="button">${t('delete')}</button>
      </div>
    `
  }).join('')

  const cur = keys[selected] && normalizeApiKey(keys[selected])
  const curStyle = (cur && cur.apiStyle === 'response') ? 'response' : 'chat'

  openModal(`
    <h2>${t('apiSettings')}</h2>
    ${rows || `<div class="empty">${t('noApi')}</div>`}

    <h3 style="margin-top:16px">${t('addUpdate')}</h3>
    <label style="color:var(--dim);font-size:12px">${t('proto')}</label>
    <select id="k-style" style="width:100%;margin-top:6px;background:#0d1526;color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:8px">
      <option value="chat" ${curStyle === 'chat' ? 'selected' : ''}>chat — Chat Completions</option>
      <option value="response" ${curStyle === 'response' ? 'selected' : ''}>response — Responses API</option>
    </select>
    <div style="font-size:12px;color:var(--faint);margin-top:6px" id="k-style-help">${STYLE_HELP[curStyle]}</div>

    <label style="color:var(--dim);font-size:12px;display:block;margin-top:12px">${t('baseUrl')}</label>
    <input id="k-base" type="text" placeholder="${t('kBasePh')}" value="${esc(cur ? (cur.baseUrl || '') : '')}">

    <label style="color:var(--dim);font-size:12px;display:block;margin-top:12px">${t('apiKey')}</label>
    <input id="k-value" type="password" placeholder="sk-…" autocomplete="off" value="">

    <label style="color:var(--dim);font-size:12px;display:block;margin-top:12px">${t('noteName')}</label>
    <input id="k-name" type="text" placeholder="${t('kNamePh')}" value="${esc(cur ? (cur.name || '') : '')}">

    <label style="color:var(--dim);font-size:12px;display:block;margin-top:12px">${t('model')}</label>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
      <input id="k-model" type="text" style="margin-top:0;flex:1" placeholder="${t('kModelPh')}" value="${esc(cur ? (cur.model || '') : '')}">
      <button class="btn btn-sm" id="k-refresh" type="button" title="GET {Base URL}/models">${t('refreshModels')}</button>
    </div>
    <select id="k-model-list" style="width:100%;margin-top:8px;background:#0d1526;color:var(--text);border:1px solid var(--line2);border-radius:8px;padding:8px;display:none">
      <option value="">${t('pickFromList')}</option>
    </select>
    <div style="font-size:12px;color:var(--faint);margin-top:4px" id="k-model-hint">${t('modelHint')}</div>

    <div style="font-size:12px;color:var(--faint);margin-top:10px" id="k-preview"></div>

    <div class="btn-row">
      <button class="btn btn-gold" id="k-add" type="button">${t('saveUse')}</button>
      <button class="btn" data-close type="button">${t('close')}</button>
    </div>
  `)

  const selStyle = document.getElementById('k-style')
  const help = document.getElementById('k-style-help')
  const baseEl = document.getElementById('k-base')
  const modelEl = document.getElementById('k-model')
  const valEl = document.getElementById('k-value')
  const nameEl = document.getElementById('k-name')
  const preview = document.getElementById('k-preview')
  const refreshBtn = document.getElementById('k-refresh')
  const modelList = document.getElementById('k-model-list')
  const modelHint = document.getElementById('k-model-hint')

  function currentKey() {
    return valEl.value.trim() || (cur && (cur.key || cur.value)) || ''
  }

  modelList.onchange = () => {
    const v = modelList.value
    if (!v) return
    modelEl.value = v
    if (!nameEl.value.trim()) nameEl.value = v
    refreshPreview()
  }

  refreshBtn.onclick = async () => {
    const baseUrl = baseEl.value.trim()
    const key = currentKey()
    if (!baseUrl) { toast(t('fillBaseUrlKey')); return }
    if (!key) { toast(t('fillApiKey')); return }
    refreshBtn.disabled = true
    const old = refreshBtn.textContent
    refreshBtn.textContent = t('pulling')
    modelHint.textContent = t('requestingModels')
    const r = await listModels({ baseUrl, key })
    refreshBtn.disabled = false
    refreshBtn.textContent = old
    if (!r.ok) {
      modelHint.innerHTML = `<span style="color:var(--red)">t('fetchFailPrefix')${esc(r.error || '')}</span>`
      toast(t('fetchFail'))
      return
    }
    const models = r.models || []
    modelList.innerHTML = `<option value="">— ${t('modelListN')} ${models.length} ${t('modelListPick')} —</option>` +
      models.map(id => `<option value="${esc(id)}" ${id === modelEl.value ? 'selected' : ''}>${esc(id)}</option>`).join('')
    modelList.style.display = ''
    modelHint.innerHTML = `${t('fetchedModels')} ${models.length} ${t('fetchedModels2')}（${esc(r.url || '')}）。${t('pickOrType')}`
    toast(`${t('fetchedN')} ${models.length}${t('modelsN')}`)
  }

  function refreshPreview() {
    help.textContent = STYLE_HELP[selStyle.value] || ''
    const fake = {
      baseUrl: baseEl.value.trim(),
      key: currentKey(),
      model: modelEl.value.trim(),
      apiStyle: selStyle.value
    }
    const n = normalizeApiKey(fake)
    preview.textContent = n
      ? t('reqAddr') + endpointOf(n)
      : t('reuseKeyHint')
  }
  selStyle.onchange = refreshPreview
  baseEl.oninput = refreshPreview
  modelEl.oninput = refreshPreview
  valEl.oninput = refreshPreview
  refreshPreview()

  document.getElementById('k-add').onclick = () => {
    const apiStyle = selStyle.value === 'response' ? 'response' : 'chat'
    const baseUrl = baseEl.value.trim().replace(/\/+$/, '')
    const model = modelEl.value.trim()
    const keyInput = valEl.value.trim()
    const name = nameEl.value.trim() || model || t('selfDefault')
    const selNow = (S && typeof S.selectedKey === 'number') ? S.selectedKey : selected
    if (!baseUrl || !model) {
      toast(t('fillBaseModel'))
      return
    }
    let key = keyInput
    if (!key) {
      // 更新已有配置时允许不重填 Key
      const old = typeof selNow === 'number' ? keys[selNow] : null
      key = (old && (old.key || old.value)) || ''
    }
    if (!key) {
      toast(t('fillApiKey'))
      return
    }
    const rec = { name, baseUrl, key, model, apiStyle }
    if (!S || useStandalone) {
      // 欢迎页 / 无 keys 存档：写入全局 Key 库
      persistKeysStandalone(rec, selNow, keyInput)
      save()
      refreshAll()
      closeModal()
      toast(t('apiSaved'))
      return
    }
    S.playerKeys = S.playerKeys || []
    if (typeof selNow === 'number' && S.playerKeys[selNow] && !keyInput) {
      // 覆盖当前条目（沿用原 Key）
      S.playerKeys[selNow] = rec
    } else if (typeof selNow === 'number' && S.playerKeys[selNow] && keyInput && keyInput === (S.playerKeys[selNow].key || S.playerKeys[selNow].value)) {
      S.playerKeys[selNow] = rec
    } else {
      S.playerKeys.push(rec)
      S.selectedKey = S.playerKeys.length - 1
    }
    if (typeof S.selectedKey === 'number' && S.playerKeys[S.selectedKey]) {
      // 保持选用
    } else {
      S.selectedKey = S.playerKeys.length - 1
    }
    save()
    refreshAll()
    closeModal()
    toast(t('apiSaved'))
  }

  document.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.del)
      if (!S || useStandalone) {
        deleteKeyStandalone(i)
        save()
        closeModal()
        openKeyModal(app, { save, refreshAll })
        return
      }
      S.playerKeys = S.playerKeys || []
      S.playerKeys.splice(i, 1)
      if (S.selectedKey === i) S.selectedKey = 0
      else if (typeof S.selectedKey === 'number' && S.selectedKey > i) S.selectedKey -= 1
      if (!S.playerKeys.length) S.selectedKey = 0
      save()
      closeModal()
      openKeyModal(app, { save, refreshAll })
    }
  })

  document.querySelectorAll('input[name=selkey]').forEach(r => {
    r.onchange = () => {
      if (!r.checked) return
      const idx = Number(r.value)
      if (!S || useStandalone) {
        selectKeyStandalone(idx)
        selected = idx
        save()
        refreshAll()
        return
      }
      S.selectedKey = idx
      selected = idx
      save()
      refreshAll()
    }
  })
}

export function openHelp(app) {
  const S = app.S
  const pack = S ? (globalThis.__AW_PACKS__[S.worldview]) : null
  const ui = pack && pack.ui ? pack.ui : { advanceBtn: t('advance') }
  openModal(`
    <h2>${t('helpTitle')}${esc(pack ? pack.name : t('brand'))}</h2>
    <p>${esc(pack ? pack.tagline : '')}</p>
    <p>1. ${t('helpP1')} <b>🔑 API</b> ${t('helpP1b')} <b>chat</b> ${t('helpP1c')} <b>response</b>。</p>
    <p>2. ${t('helpP2')} <b>${t('navScene')}</b> ${t('helpP2b')}</p>
    <p>3. ${t('helpP3')} <b>${esc(pack ? pack.lexicon.progress : t('progressWord'))}</b> ${t('helpP3b')} <b>${esc(ui.advanceBtn)}</b> ${t('helpP3c')}${esc(pack ? pack.lexicon.level : t('levelWord'))}。</p>
    <p>4. <b>🌐 ${t('worlds')}</b> ${t('helpP4')}</p>
    <p>5. ${t('api')} <b>🔑</b> ${t('helpP5')}</p>
    <p style="color:var(--faint);font-size:12px">${t('helpProto')}</p>
    <div class="btn-row"><button class="btn btn-gold" data-close type="button">${t('ok')}</button></div>
  `)
}

function persistKeysStandalone(rec, selNow, keyInput) {
  try {
    const data = loadKeyStore()
    const exists = data.keys[selNow]
    if (exists) data.keys[selNow] = rec
    else {
      data.keys.push(rec)
      data.selected = data.keys.length - 1
    }
    writeKeyStore(data)
  } catch (e) { /* ignore */ }
}

function deleteKeyStandalone(i) {
  try {
    const data = loadKeyStore()
    data.keys.splice(i, 1)
    if (data.selected === i) data.selected = 0
    else if (typeof data.selected === 'number' && data.selected > i) data.selected -= 1
    if (!data.keys.length) data.selected = 0
    writeKeyStore(data)
  } catch (e) { /* ignore */ }
}

function selectKeyStandalone(idx) {
  try {
    const data = loadKeyStore()
    if (data.keys[idx]) data.selected = idx
    writeKeyStore(data)
  } catch (e) { /* ignore */ }
}

let _keyStoreCache = null

function writeKeyStore(data) {
  // 内存缓存：同步读取必须走这里
  _keyStoreCache = { keys: (data.keys || []).slice(), selected: data.selected }
  const host = window.awHost && window.awHost.secrets
  if (host && host.save) {
    // 宿主加密仓可用时绝不写明文 localStorage（成功/失败都不写）
    host.save(data).then(() => {
      try { localStorage.removeItem('agentworlds_apikeys_v1') } catch (e) { /* ignore */ }
    }).catch(() => {
      try { localStorage.removeItem('agentworlds_apikeys_v1') } catch (e) { /* ignore */ }
    })
    return
  }
  try { localStorage.setItem('agentworlds_apikeys_v1', JSON.stringify(data)) } catch (e) { /* ignore */ }
}

function loadKeyStore() {
  if (_keyStoreCache && Array.isArray(_keyStoreCache.keys)) return _keyStoreCache
  const host = window.awHost && window.awHost.secrets
  try {
    const raw = localStorage.getItem('agentworlds_apikeys_v1')
    if (raw) {
      const d = JSON.parse(raw)
      if (!Array.isArray(d.keys)) d.keys = []
      _keyStoreCache = d
      // 宿主可用时把明文一次性迁入加密仓并删除
      if (host && host.save) {
        host.save(d).then(() => {
          try { localStorage.removeItem('agentworlds_apikeys_v1') } catch (e) { /* ignore */ }
        }).catch(() => { /* ignore */ })
      }
      return d
    }
  } catch (e) { /* ignore */ }
  return _keyStoreCache || { keys: [], selected: 0 }
}
