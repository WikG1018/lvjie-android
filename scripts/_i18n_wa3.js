const fs = require('fs')
const path = require('path')

// 修 _i18n_wa2.js 坏掉的引号行
{
  const p = path.resolve('scripts/_i18n_wa2.js')
  let t = fs.readFileSync(p, 'utf8')
  const badStart = t.indexOf("  ['`已拉取")
  const badEnd = t.indexOf("],", badStart)
  if (badStart >= 0 && badEnd > badStart) {
    const line = "  ['已拉取 ${models.length} 个模型（${esc(r.url || \"\")}）。下拉选择或继续手填。', \"${t('fetchedModels')} ${models.length} ${t('fetchedModels2')}（${esc(r.url || '')}）。${t('pickOrType')}\"],\n"
    t = t.slice(0, badStart) + line + t.slice(badEnd + 2)
    fs.writeFileSync(p, t)
    console.log('fixed wa2 script')
  } else {
    console.log('wa2 pattern', badStart, badEnd)
  }
}

// 直接做剩余替换（不经坏脚本）
function rep(file, pairs) {
  const p = path.resolve(file)
  let t = fs.readFileSync(p, 'utf8')
  let n = 0
  for (const [a, b] of pairs) {
    if (t.includes(a)) {
      t = t.split(a).join(b)
      n++
    } else {
      console.log('MISS', String(a).slice(0, 50).replace(/\n/g, ' '))
    }
  }
  fs.writeFileSync(p, t)
  console.log(path.basename(file), 'replaced', n)
}

// i18n 键
{
  const p = path.resolve('app/js/engine/i18n.js')
  let t = fs.readFileSync(p, 'utf8')
  const extra = [
    ["waEditable", "可编辑后保存。"],
    ["waJsonPh", '{"id":"my-world","name":"my-world",…}'],
    ["styleHelpChat", "Chat Completions (OpenAI-compatible): POST …/chat/completions"],
    ["styleHelpResp", "Responses API: POST …/responses"],
    ["kBasePh", "e.g. https://api.openai.com/v1 or https://your-gateway/v1"],
    ["kNamePh", "My OpenAI / company gateway…"],
    ["kModelPh", "e.g. gpt-4.1-mini / glm-4-flash / deepseek-chat"],
    ["modelListN", "Total"],
    ["modelListPick", "items, pick one"],
    ["fetchedModels", "Fetched"],
    ["fetchedModels2", " models"],
    ["pickOrType", "Pick from list or type manually."],
    ["waWorldWord", "world"],
  ]
  if (!t.includes('waEditable:')) {
    let block = ''
    for (const [k, v] of extra) {
      const vv = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      block += `    ${k}: '${vv}',\n`
    }
    t = t.replace("    subHi: '高',", "    subHi: '高',\n" + block)
    fs.writeFileSync(p, t)
    console.log('i18n keys ok')
  }
}

rep('app/js/ui/settings-panels.js', [
  ["chat: 'Chat Completions（OpenAI / 兼容网关常见）：POST …/chat/completions'", "chat: t('styleHelpChat')"],
  ["response: 'Responses API（OpenAI 新版）：POST …/responses'", "response: t('styleHelpResp')"],
  ['placeholder="例如 https://api.openai.com/v1 或 https://your-gateway/v1"', 'placeholder="${t(\'kBasePh\')}"'],
  ['placeholder="我的 OpenAI / 公司网关…"', 'placeholder="${t(\'kNamePh\')}"'],
  ['placeholder="例如 gpt-4.1-mini / glm-4-flash / deepseek-chat"', 'placeholder="${t(\'kModelPh\')}"'],
  ['— 共 ${models.length} 个，选择填入 —', '— ${t(\'modelListN\')} ${models.length} ${t(\'modelListPick\')} —'],
  ['已拉取 ${models.length} 个模型（${esc(r.url || \'\')}）。下拉选择或继续手填。', "${t('fetchedModels')} ${models.length} ${t('fetchedModels2')}（${esc(r.url || '')}）。${t('pickOrType')}"],
])

rep('app/js/ui/world-author.js', [
  ["placeholder='{\"id\":\"my-world\",\"name\":\"我的世界\",…}'", 'placeholder=\'${t(\'waJsonPh\')}\''],
  ['（${v.pack.tiers.length} 阶 · 地点 ${v.pack._decl.map.length}）。可编辑后保存。', "（${v.pack.tiers.length} ${t('waTiers')} · ${v.pack._decl.map.length} ${t('waLands')}）。${t('waEditable')}"],
  [' · ${v.pack.tiers.length} 阶 · 地点 ${v.pack._decl.map.length} · 世界 ${v.pack.worlds.join(\'/\')}', " · ${v.pack.tiers.length} ${t('waTiers')} · ${v.pack._decl.map.length} ${t('waLands')} · ${v.pack.worlds.join('/')}"],
])

console.log('done')
