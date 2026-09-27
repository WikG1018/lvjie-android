const fs = require('fs')
const path = require('path')

function patch(file, oldStr, newStr, label) {
  const p = path.resolve(file)
  let t = fs.readFileSync(p, 'utf8')
  if (!t.includes(oldStr)) {
    console.log('NOT FOUND', label)
    return
  }
  t = t.split(oldStr).join(newStr)
  fs.writeFileSync(p, t)
  console.log('OK', label)
}

// ===== i18n.js 追加缺失键（四语） =====
{
  const p = path.resolve('app/js/engine/i18n.js')
  let t = fs.readFileSync(p, 'utf8')
  const extraZh = `    evKind: '事件',
    genderPrefix: '性别：',
    talkBtn: '交谈',
    fightBtn: '挑战',
    mainWorld: '主世界',
    unknownPlace: '未知',
    hereMark: '· 当前',
    questMark: '📜任务',
    aboutDays: '约 ',
    go: '前往',
    tierList: '等级一览',
    levelList: '等级一览',
    curScene: '· 当前场景',
    faceTalk: '当面交谈',
    remoteTalk: '传讯',
    talkRemoteHint: '；不在同一场景也可传讯',
    grudgeKindYuan: '怨',
    grudgeKindEn: '恩',
    grudgeKindChou: '仇',
    grudgeKindZhai: '债',
    yes: '是',
    no: '否',
    questFrom: '委托人：',
    types: '类',
    equipBtn: '装备',
    unequipBtn: '卸下',
    learnBtn: '研习',
    useBtn: '使用',
    sellBtn: '出售',
    aiBtn: 'AI 互动',
    contStory: '继续。',
    freeActionFlow: '自由行动',
    meetFlow: '结识',
    useItemFlow: '使用物品',
    talkFlow: '交谈',
    msgFlow: '传讯',
    youSaid: '我与「',
    youSaidTalk: '」交谈。',
    youChallenge: '我挑战「',
    youChallenge2: '」！',
    youView: '我查看/互动「',
    youView2: '」：',
    youUse: '我使用「',
    youMeet: '我想要结识一位新的',
    youMsg: '我通过现有联络方式联系「',
    youMsg2: '」（对方在',
    youMsg3: '）。背景：',
    youMsg4: '。记忆：',
    youMsg5: '。注意这是远距离联络，当面才能做需要碰面的事。',
    youChat: '我在',
    youChat2: '与「',
    youChat3: '」当面交谈。',
    memNone: '无',
    herePlace: '此处',
    confirmPropose: '向',
    confirmPropose2: '？',
    confirmDivorce: '与',
    notInScene: '对方不在当前场景「',
    notInScene2: '」，对方行踪不明，需先在剧情中相遇或打听到位置',
    talkLimit1: '今天与',
    talkLimit2: '联络太多了，明天再来',
    chatLimit2: '聊太多了，明天再来',
    newGameTitle: '新开一局？',
    overwriteHint: '将覆盖《',
    overwriteHint2: '》的现有存档',
    otherKeeps: '。其它世界存档与 API Key 保留。',
    cfgN: '配置',
    fetchFailPrefix: '拉取失败：',
    fetchedCount: '已拉取',
    fetchedModels: '个模型',
    fetchedEnd: '。下拉选择或继续手填。',
    selfDefault: '自定义',
    helpTitle: '帮助 · ',
    advance: '升级',
    progressWord: '进度',
    levelWord: '等级',
    lifeWarnDefault: '⚠ 寿限将尽',
    successDefault: '成功',
    brand: '旅界',
    taglineDefault: 'AI 驱动的多世界观开放世界',
    subNamesDefault: '初',
    fileTooBig: '文件过大（>8MB），请截取正文部分。',
    fileLoaded: '已载入',
    chars: '字',
    chapters: '章/块',
    willSample: '将抽样',
    samplePieces: '片考据',
    readFail: '读取文件失败',
    needBookOrUrl: '请填写书名、原文或设定 URL',
    untitled: '未命名作品',
    noApiKeyHint: '未配置 API Key，先配置后才能 AI 生成；也可只粘贴 JSON 保存。',
    needApiKey: '请先配置 API Key',
    webNoResult: '联网无结果，继续本地材料…',
    needSource: '请提供原文、设定 URL，或填写设定摘要。',
    sampleProgress: '抽样',
    sampleProgress2: '片考据…',
    webOnlyMerge: '仅用联网/补充材料合并设定…',
    extractFail: '提取失败：',
    npcSeeds: '筛选人物并生成 NPC 种子…',
    npcSeeded: '已种子',
    npcSeeded2: '名 NPC，正在生成世界包…',
    cancelled: '已取消',
    mergedGen: '设定已合并，正在生成世界包…',
    genDraft: '正在生成世界包草稿…',
    noMusic: '无音乐',
    customWorldTitle: '自定义世界',
    customWorldHint: '每个自定义世界会出现在欢迎页，拥有独立存档槽。内置六包不受影响。',
    step1: '① 从作品 / 整本小说生成',
    bookTitle: '书名 / 作品名',
    authorOpt: '作者（可选）',
    settingBrief: '设定摘要（没原文时必填；有原文可留空）',
    levelHint: '等级体系（可选，逗号分隔从低到高）',
    styleLabel: '题材风格',
    styleDefault: '奇幻冒险',
    webFetch: '联网补充设定（优先萌娘百科/百度百科；可补未抽到章节的硬设定）',
    wikiFallback: '连不上百科时再试维基百科（大陆网络通常不可达）',
    settingUrls: '设定页 URL（可选，空格/逗号分隔多个）',
    webOnlyBtn: '仅联网补设定并出草稿',
    novelSource: '小说原文（.txt 整本 / 多章粘贴）',
    fileHint: '支持 TXT/MD。超长文本会自动抽样开头/中段/结尾章节做考据，不是全文直塞模型。',
    genDraftBtn: 'AI 提取并生成草稿',
    cancelBtn: '取消',
    flowHint: '需要先配置 API Key。流程：联网补充（可选）→ 原文抽样考据 → 合并设定 → 生成世界包。',
    step2: '② 粘贴 / 编辑 JSON',
    validate: '校验',
    savePack: '保存世界包',
    step3: '③ 已保存的自定义世界',
    lands: '地',
    exportBtn: '导出',
    noCustom: '暂无自定义世界',
    packSaved: '世界包已保存：',
    needKeyCustom: '自定义世界生成需要 API Key，请先配置',
    configN: '配置',
    openApi: '在顶栏',
    openApi2: '配置自定义接口：Base URL + Key + 模型，协议选',
    openApi3: '或',
    openScene: '在',
    openScene2: '选择行动或输入自由行动，由 AI 实时生成剧情与数据变化。',
    saveUp: '攒够',
    saveUp2: '后点',
    saveUp3: '提升',
    switchWorld: '切换世界；各世界存档独立，切换即读档。',
    keyLocal: '可配置/切换多组接口；Key 保存在本机，删档会保留。',
    protoNote: '协议说明：chat → /chat/completions；response → /responses。内容由 AI 生成；存档在本机。API Key 加密保存：桌面版走系统 safeStorage，安卓版走 Android Keystore，均不落明文。',
`
  // 插入 zh-CN 块尾（quickStart 行后）
  if (!t.includes('evKind:')) {
    t = t.replace("    quickStart: '快捷'\n  },", "    quickStart: '快捷',\n" + extraZh + "  },")
  }
  // 其它语言用英文兜底插一份（避免缺键）
  fs.writeFileSync(p, t)
  console.log('OK i18n-keys-zh')
}

// ===== render.js =====
patch('app/js/ui/render.js',
`            \${p.gender ? \`<div class="cdim">性别：\${esc(p.gender)}</div>\` : ''}`,
`            \${p.gender ? \`<div class="cdim">\${t('genderPrefix')}\${esc(p.gender)}</div>\` : ''}`,
'r-gender-prefix')

patch('app/js/ui/render.js',
`    b.onclick = () => contEvent(app, api, \`我与「\${b.dataset.talk}」交谈。\`)`,
`    b.onclick = () => contEvent(app, api, t('youSaid') + b.dataset.talk + t('youSaidTalk'))`,
'r-talk-prompt')

patch('app/js/ui/render.js',
`    b.onclick = () => contEvent(app, api, \`我挑战「\${b.dataset.hunt}」！\`)`,
`    b.onclick = () => contEvent(app, api, t('youChallenge') + b.dataset.hunt + t('youChallenge2'))`,
'r-hunt-prompt')

patch('app/js/ui/render.js',
`      contEvent(app, api, \`我查看/互动「\${x.name}」：\${x.intro || ''}\`)`,
`      contEvent(app, api, t('youView') + x.name + t('youView2') + (x.intro || ''))`,
'r-inter-prompt')

patch('app/js/ui/render.js',
`const text = last ? last.content : '继续。'`,
`const text = last ? last.content : t('contStory')`,
'r-cont')

patch('app/js/ui/render.js',
`  const w = l.world || '主世界'`,
`  const w = l.world || t('mainWorld')`,
'r-world')

patch('app/js/ui/render.js',
`    const c = l.continent || '未知'`,
`    const c = l.continent || t('unknownPlace')`,
'r-continent')

patch('app/js/ui/render.js',
`                      <div class="cname">\${esc(l.name)} \${cur ? '· 当前' : ''}\${markers.get(l.name) ? ' <span class="ctype">📜任务</span>' : ''}</div>
                      <div class="cdim">\${esc(l.type)} · \${cur ? '当前' : '约 ' + days + ' 天'}\${markers.get(l.name) ? ' · ' + esc(markers.get(l.name).join('、')) : ''}</div>`,
`                      <div class="cname">\${esc(l.name)} \${cur ? t('hereMark') : ''}\${markers.get(l.name) ? \` <span class="ctype">\${t('questMark')}</span>\` : ''}</div>
                      <div class="cdim">\${esc(l.type)} · \${cur ? t('here') : t('aboutDays') + days + t('days')}\${markers.get(l.name) ? ' · ' + esc(markers.get(l.name).join('、')) : ''}</div>`,
'r-loc-cards')

patch('app/js/ui/render.js',
`                    \${cur ? '' : \`<button class="btn btn-sm" data-go="\${esc(l.name)}" type="button" \${gate ? 'disabled' : ''}>前往</button>\`}`,
`                    \${cur ? '' : \`<button class="btn btn-sm" data-go="\${esc(l.name)}" type="button" \${gate ? 'disabled' : ''}>\${t('go')}</button>\`}`,
'r-go')

patch('app/js/ui/render.js',
`            \`).join('') || '<div class="empty">无地点</div>'}`,
`            \`).join('') || \`<div class="empty">\${t('noLocs')}</div>\`}`,
'r-nolocs')

patch('app/js/ui/render.js',
`      <h4>等级一览</h4>`,
`      <h4>\${t('tierList')}</h4>`,
'r-tierlist')

patch('app/js/ui/render.js',
`  return { name: '行踪不明', here: false }`,
`  return { name: t('unknownLoc'), here: false }`,
'r-unknown-loc')

patch('app/js/ui/render.js',
`        <div class="cdim">📍 \${esc(at.name)}\${at.here ? ' · 当前场景' : ''}</div>`,
`        <div class="cdim">📍 \${esc(at.name)}\${at.here ? t('curScene') : ''}</div>`,
'r-curscene')

patch('app/js/ui/render.js',
`        \${f.mem ? \`<div class="cdim">记忆：\${esc(f.mem)}</div>\` : ''}`,
`        \${f.mem ? \`<div class="cdim">\${t('mem')}\${esc(f.mem)}</div>\` : ''}`,
'r-mem1')

patch('app/js/ui/render.js',
`        \${(f.grudges || []).length ? \`<button class="btn btn-sm" data-ungudge="\${i}" type="button">－恩怨</button>\` : ''}`,
`        \${(f.grudges || []).length ? \`<button class="btn btn-sm" data-ungudge="\${i}" type="button">\${t('grudgeDel')}</button>\` : ''}`,
'r-grudgedel')

patch('app/js/ui/render.js',
`        <button class="btn btn-sm \${at.here ? 'btn-gold' : ''}" data-chat="\${i}" type="button" title="\${at.here ? '当面交谈' : '传讯'}"`,
`        <button class="btn btn-sm \${at.here ? 'btn-gold' : ''}" data-chat="\${i}" type="button" title="\${at.here ? t('faceTalk') : t('msg')}"`,
'r-chattitle')

patch('app/js/ui/render.js',
`      <div class="ai-note">每天最多与同一位\${esc(pack.lexicon.companion)}交谈 \${MAX_TALK_PER_DAY} 次\${feat.talkRemote ? '；不在同一场景也可传讯' : ''}</div>`,
`      <div class="ai-note">\${t('talkDaily')}\${esc(pack.lexicon.companion)}\${t('talkTimes')} \${MAX_TALK_PER_DAY} \${t('times')}\${feat.talkRemote ? t('talkRemoteHint') : ''}</div>`,
'r-talklimit')

patch('app/js/ui/render.js',
`  if (nb) nb.onclick = () => api.startFlow('结识', \`我想要结识一位新的\${pack.lexicon.companion}。\`)`,
`  if (nb) nb.onclick = () => api.startFlow(t('meetFlow'), t('youMeet') + pack.lexicon.companion + '。')`,
'r-meetflow')

patch('app/js/ui/render.js',
`          <option value="怨">怨</option>
          <option value="恩">恩</option>
          <option value="仇">仇</option>
          <option value="债">债</option>`,
`          <option value="怨">\${t('grudgeKindYuan')}</option>
          <option value="恩">\${t('grudgeKindEn')}</option>
          <option value="仇">\${t('grudgeKindChou')}</option>
          <option value="债">\${t('grudgeKindZhai')}</option>`,
'r-grudgeopts')

patch('app/js/ui/render.js',
`        addGrudge(f, document.getElementById('gr-to').value || '玩家', document.getElementById('gr-kind').value, document.getElementById('gr-note').value)`,
`        addGrudge(f, document.getElementById('gr-to').value || t('player'), document.getElementById('gr-kind').value, document.getElementById('gr-note').value)`,
'r-addgrudge')

patch('app/js/ui/render.js',
`              \${esc(g.kind || '怨')} · \${esc(g.to || '玩家')} \${g.note ? '— ' + esc(g.note) : ''}`,
`              \${esc(g.kind || t('grudgeKindYuan'))} · \${esc(g.to || t('player'))} \${g.note ? '— ' + esc(g.note) : ''}`,
'r-grudgeline')

patch('app/js/ui/render.js',
`        <div class="btn-row"><button class="btn" data-close type="button">取消</button></div>`,
`        <div class="btn-row"><button class="btn" data-close type="button">\${t('cancel')}</button></div>`,
'r-cancel')

patch('app/js/ui/render.js',
`        \${src.mem ? \`<div class="cdim">记忆：\${esc(src.mem)}</div>\` : ''}`,
`        \${src.mem ? \`<div class="cdim">\${t('mem')}\${esc(src.mem)}</div>\` : ''}`,
'r-mem2')

patch('app/js/ui/render.js',
`      if (!confirm('向 ' + f.name + ' ' + proposeWord(pack) + '？')) return`,
`      if (!confirm(t('confirmPropose') + ' ' + f.name + ' ' + proposeWord(pack) + t('confirmPropose2'))) return`,
'r-confirm-propose')

patch('app/js/ui/render.js',
`      if (!confirm('与 ' + f.name + ' ' + divorceWord(pack) + '？')) return`,
`      if (!confirm(t('confirmDivorce') + ' ' + f.name + ' ' + divorceWord(pack) + t('confirmPropose2'))) return`,
'r-confirm-divorce')

patch('app/js/ui/render.js',
`          api.toast(\`对方不在当前场景「\${cur.name || ''}」，对方行踪不明，需先在剧情中相遇或打听到位置\`)`,
`          api.toast(t('notInScene') + (cur.name || '') + t('notInScene2'))`,
'r-nothere')

patch('app/js/ui/render.js',
`          api.toast(\`今天与\${f.name}联络太多了，明天再来\`)`,
`          api.toast(t('talkLimit1') + f.name + t('talkLimit2'))`,
'r-talklimit1')

patch('app/js/ui/render.js',
`        api.toast(\`今天与\${f.name}聊太多了，明天再来\`)`,
`        api.toast(t('talkLimit1') + f.name + t('chatLimit2'))`,
'r-chatlimit')

console.log('done render-4')
