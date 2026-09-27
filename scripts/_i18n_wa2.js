const fs = require('fs')
const path = require('path')

function rep(file, pairs) {
  const p = path.resolve(file)
  let t = fs.readFileSync(p, 'utf8')
  let n = 0
  for (const [a, b] of pairs) {
    if (t.includes(a)) {
      t = t.split(a).join(b)
      n++
    } else {
      console.log('MISS', String(a).slice(0, 55).replace(/\n/g, '\\n'))
    }
  }
  fs.writeFileSync(p, t)
  console.log(path.basename(file), 'replaced', n)
}

// i18n 追加键
{
  const p = path.resolve('app/js/engine/i18n.js')
  let t = fs.readFileSync(p, 'utf8')
  const keys = `    waEditable: '可编辑后保存。',
    waJsonPh: '{"id":"my-world","name":"我的世界",…}',
    styleHelpChat: 'Chat Completions（OpenAI / 兼容网关常见）：POST …/chat/completions',
    styleHelpResp: 'Responses API（OpenAI 新版）：POST …/responses',
    kBasePh: '例如 https://api.openai.com/v1 或 https://your-gateway/v1',
    kNamePh: '我的 OpenAI / 公司网关…',
    kModelPh: '例如 gpt-4.1-mini / glm-4-flash / deepseek-chat',
    modelListN: '共',
    modelListPick: '个，选择填入',
    fetchedModels: '已拉取',
    fetchedModels2: '个模型',
    pickOrType: '下拉选择或继续手填。',
`
  if (!t.includes('waEditable:')) {
    t = t.replace("    levelWord: '等级',", "    waEditable: '可编辑后保存。',\n    levelWord: '等级',")
    // 上面可能没命中，改插在 subHi 后
    if (!t.includes('waEditable:')) {
      t = t.replace("    subHi: '高',", "    subHi: '高',\n" + keys)
    } else {
      t = t.replace("    waEditable: '可编辑后保存。',", keys)
    }
    fs.writeFileSync(p, t)
    console.log('keys added')
  }
}

rep('app/js/ui/settings-panels.js', [
  ["chat: 'Chat Completions（OpenAI / 兼容网关常见）：POST …/chat/completions'", "chat: t('styleHelpChat')"],
  ["response: 'Responses API（OpenAI 新版）：POST …/responses'", "response: t('styleHelpResp')"],
  ['placeholder="例如 https://api.openai.com/v1 或 https://your-gateway/v1"', 'placeholder="${t(\'kBasePh\')}"'],
  ['placeholder="我的 OpenAI / 公司网关…"', 'placeholder="${t(\'kNamePh\')}"'],
  ['placeholder="例如 gpt-4.1-mini / glm-4-flash / deepseek-chat"', 'placeholder="${t(\'kModelPh\')}"'],
  ['— 共 ${models.length} 个，选择填入 —', '— ${t(\'modelListN\')} ${models.length} ${t(\'modelListPick\')} —'],
  ['已拉取 ${models.length} 个模型（${esc(r.url || "")}）。下拉选择或继续手填。', "${t('fetchedModels')} ${models.length} ${t('fetchedModels2')}（${esc(r.url || '')}）。${t('pickOrType')}"],

])

rep('app/js/ui/world-author.js', [
  ["placeholder='{\"id\":\"my-world\",\"name\":\"我的世界\",…}'", 'placeholder=\'${t(\'waJsonPh\')}\''],
  ['（${v.pack.tiers.length} 阶 · 地点 ${v.pack._decl.map.length}）。可编辑后保存。', "（${v.pack.tiers.length} ${t('waTiers')} · ${v.pack._decl.map.length} ${t('waLands')}）。${t('waEditable')}"],
  [' · ${v.pack.tiers.length} 阶 · 地点 ${v.pack._decl.map.length} · 世界 ${v.pack.worlds.join(\'/\')}', " · ${v.pack.tiers.length} ${t('waTiers')} · ${v.pack._decl.map.length} ${t('waLands')} · ${v.pack.worlds.join('/')}"],
  ['v.errors.join(\'；\')', "v.errors.join('; ')"],
  ['(saved.errors || []).join(\'；\')', "(saved.errors || []).join('; ')"],
])

console.log('done')
