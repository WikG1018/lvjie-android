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
      console.log('MISS', String(a).slice(0, 60).replace(/\n/g, '\\n'))
    }
  }
  fs.writeFileSync(p, t)
  console.log(path.basename(file), 'replaced', n)
}

// ===== i18n 追加 world-author / help 键（zh-CN，缺键回退） =====
{
  const p = path.resolve('app/js/engine/i18n.js')
  let t = fs.readFileSync(p, 'utf8')
  const keys = `    waNeedKey: '自定义世界生成需要 API Key，请先配置',
    waTitle: '自定义世界',
    waHint: '每个自定义世界会出现在欢迎页，拥有独立存档槽。内置六包不受影响。',
    waStep1: '① 从作品 / 整本小说生成',
    waBookTitle: '书名 / 作品名',
    waBookPh: '例如 诡秘之主',
    waAuthor: '作者（可选）',
    waAuthorPh: '例如 爱潜水的乌贼',
    waSetting: '设定摘要（没原文时必填；有原文可留空）',
    waSettingPh: '力量体系、地理、主要势力、主角开局处境…',
    waLevels: '等级体系（可选，逗号分隔从低到高）',
    waLevelsPh: '序列九…序列零 / 学徒…半神',
    waStyle: '题材风格',
    waStyleDef: '奇幻冒险',
    waWeb: '联网补充设定（优先萌娘百科/百度百科；可补未抽到章节的硬设定）',
    waWiki: '连不上百科时再试维基百科（大陆网络通常不可达）',
    waUrls: '设定页 URL（可选，空格/逗号分隔多个）',
    waUrlsPh: 'https://…wiki / 设定帖链接',
    waWebOnly: '仅联网补设定并出草稿',
    waNovel: '小说原文（.txt 整本 / 多章粘贴）',
    waFileHint: '支持 TXT/MD。超长文本会自动抽样开头/中段/结尾章节做考据，不是全文直塞模型。',
    waBookPh2: '也可直接粘贴原文…',
    waGen: 'AI 提取并生成草稿',
    waCancel: '取消',
    waFlow: '需要先配置 API Key。流程：联网补充（可选）→ 原文抽样考据 → 合并设定 → 生成世界包。',
    waStep2: '② 粘贴 / 编辑 JSON',
    waValidate: '校验',
    waSavePack: '保存世界包',
    waStep3: '③ 已保存的自定义世界',
    waTiers: '阶',
    waLands: '地',
    waExport: '导出',
    waDelete: '删除',
    waNone: '暂无自定义世界',
    waClose: '关闭',
    waFileBig: '文件过大（>8MB），请截取正文部分。',
    waLoaded: '已载入',
    waChars: '字',
    waAbout: '约',
    waChapters: '章/块',
    waWillSample: '将抽样',
    waPieces: '片考据',
    waReadFail: '读取文件失败',
    waNeedFill: '请填写书名、原文或设定 URL',
    waUntitled: '未命名作品',
    waNoKeyHint: '未配置 API Key，先配置后才能 AI 生成；也可只粘贴 JSON 保存。',
    waNeedKey2: '请先配置 API Key',
    waWebEmpty: '联网无结果，继续本地材料…',
    waNeedSrc: '请提供原文、设定 URL，或填写设定摘要。',
    waSample: '抽样',
    waSample2: '片考据…',
    waWebMerge: '仅用联网/补充材料合并设定…',
    waExtractFail: '提取失败：',
    waNpcSeed: '筛选人物并生成 NPC 种子…',
    waNpcSeeded: '已种子',
    waNpcSeeded2: '名 NPC，正在生成世界包…',
    waCancelled: '已取消',
    waMerged: '设定已合并，正在生成世界包…',
    waGenDraft: '正在生成世界包草稿…',
    waGenFail: '生成失败：',
    waNoJson: '未解析到 JSON，已把输出放进编辑框，请手动整理。',
    waDraftOk: '草稿已生成：',
    waDraftNeedFix: '草稿需修正：',
    waJsonFail: 'JSON 解析失败',
    waValidateOk: '校验通过：',
    waOverwrite: '已存在同 id 世界包，覆盖保存？',
    waSaveFail: '保存失败',
    waSaved: '世界包已保存：',
    waExported: '已导出到下方文本框，可复制保存。',
    waDelConfirm: '删除自定义世界「',
    waDelConfirm2: '」？其存档槽会保留，仅移除世界包。',
    helpP1: '在顶栏',
    helpP1b: '配置自定义接口：Base URL + Key + 模型，协议选',
    helpP1c: '或',
    helpP2: '在',
    helpP2b: '选择行动或输入自由行动，由 AI 实时生成剧情与数据变化。',
    helpP3: '攒够',
    helpP3b: '后点',
    helpP3c: '提升',
    helpP4: '切换世界；各世界存档独立，切换即读档。',
    helpP5: '可配置/切换多组接口；Key 保存在本机，删档会保留。',
    helpProto: '协议说明：chat → /chat/completions；response → /responses。内容由 AI 生成；存档在本机。API Key 加密保存：桌面版走系统 safeStorage，安卓版走 Android Keystore，均不落明文。',
    levelWord: '等级',
    progressWord: '进度',
`
  if (!t.includes('waTitle:')) {
    t = t.replace("    subHi: '高',", "    subHi: '高',\n" + keys)
    fs.writeFileSync(p, t)
    console.log('i18n keys added')
  } else {
    console.log('i18n keys exist')
  }
}

rep('app/js/ui/world-author.js', [
  ["import { esc } from '../engine/util.js'", "import { esc } from '../engine/util.js'\nimport { t } from '../engine/i18n.js'"],
  ["toast('自定义世界生成需要 API Key，请先配置')", "toast(t('waNeedKey'))"],
  ['<h2>自定义世界</h2>', "<h2>${t('waTitle')}</h2>"],
  ['每个自定义世界会出现在欢迎页，拥有独立存档槽。内置六包不受影响。', "${t('waHint')}"],
  ['① 从作品 / 整本小说生成', "${t('waStep1')}"],
  ['书名 / 作品名</label>', "${t('waBookTitle')}</label>"],
  ['placeholder="例如 诡秘之主"', 'placeholder="${t(\'waBookPh\')}"'],
  ['作者（可选）</label>', "${t('waAuthor')}</label>"],
  ['placeholder="例如 爱潜水的乌贼"', 'placeholder="${t(\'waAuthorPh\')}"'],
  ['设定摘要（没原文时必填；有原文可留空）</label>', "${t('waSetting')}</label>"],
  ['placeholder="力量体系、地理、主要势力、主角开局处境…"', 'placeholder="${t(\'waSettingPh\')}"'],
  ['等级体系（可选，逗号分隔从低到高）</label>', "${t('waLevels')}</label>"],
  ['placeholder="序列九…序列零 / 学徒…半神"', 'placeholder="${t(\'waLevelsPh\')}"'],
  ['题材风格</label>', "${t('waStyle')}</label>"],
  ['value="奇幻冒险"', 'value="${t(\'waStyleDef\')}"'],
  ['联网补充设定（优先萌娘百科/百度百科；可补未抽到章节的硬设定）', "${t('waWeb')}"],
  ['连不上百科时再试维基百科（大陆网络通常不可达）', "${t('waWiki')}"],
  ['设定页 URL（可选，空格/逗号分隔多个）</label>', "${t('waUrls')}</label>"],
  ['placeholder="https://…wiki / 设定帖链接"', 'placeholder="${t(\'waUrlsPh\')}"'],
  ['>仅联网补设定并出草稿</button>', '>${t(\'waWebOnly\')}</button>'],
  ['小说原文（.txt 整本 / 多章粘贴）</label>', "${t('waNovel')}</label>"],
  ['支持 TXT/MD。超长文本会自动抽样开头/中段/结尾章节做考据，不是全文直塞模型。', "${t('waFileHint')}"],
  ['>AI 提取并生成草稿</button>', '>${t(\'waGen\')}</button>'],
  ['>取消</button>', '>${t(\'waCancel\')}</button>'],
  ['需要先配置 API Key。流程：联网补充（可选）→ 原文抽样考据 → 合并设定 → 生成世界包。', "${t('waFlow')}"],
  ['② 粘贴 / 编辑 JSON', "${t('waStep2')}"],
  ['>校验</button>', '>${t(\'waValidate\')}</button>'],
  ['>保存世界包</button>', '>${t(\'waSavePack\')}</button>'],
  ['③ 已保存的自定义世界', "${t('waStep3')}"],
  ['} 阶 · ${(d.map || []).length} 地</span>', "} ${t('waTiers')} · ${(d.map || []).length} ${t('waLands')}</span>"],
  ['>导出</button>', '>${t(\'waExport\')}</button>'],
  ['>删除</button>', '>${t(\'waDelete\')}</button>'],
  ["|| '<div class=\"empty\">暂无自定义世界</div>'}", '|| `<div class="empty">${t(\'waNone\')}</div>`}'],
  ['>关闭</button>', '>${t(\'waClose\')}</button>'],
  ["'文件过大（>8MB），请截取正文部分。'", "t('waFileBig')"],
  ["`已载入 ${f.name}（${text.length} 字）· 约 ${ch.chapters} 章/块 · 将抽样 ${ch.samples.length} 片考据`", "`${t('waLoaded')} ${f.name}（${text.length} ${t('waChars')}）· ${t('waAbout')} ${ch.chapters} ${t('waChapters')} · ${t('waWillSample')} ${ch.samples.length} ${t('waPieces')}`"],
  ["'读取文件失败'", "t('waReadFail')"],
  ["toast('请填写书名、原文或设定 URL')", "toast(t('waNeedFill'))"],
  ["'未命名作品'", "t('waUntitled')"],
  ["'未配置 API Key，先配置后才能 AI 生成；也可只粘贴 JSON 保存。'", "t('waNoKeyHint')"],
  ["toast('请先配置 API Key')", "toast(t('waNeedKey2'))"],
  ["'联网无结果，继续本地材料…'", "t('waWebEmpty')"],
  ["'请提供原文、设定 URL，或填写设定摘要。'", "t('waNeedSrc')"],
  ["`原文 ${ch.totalChars} 字 · 抽样 ${ch.samples.length} 片考据…`", "`${ch.totalChars} ${t('waChars')} · ${t('waSample')} ${ch.samples.length} ${t('waSample2')}`"],
  ["'仅用联网/补充材料合并设定…'", "t('waWebMerge')"],
  ["'提取失败：'", "t('waExtractFail')"],
  ["'筛选人物并生成 NPC 种子…'", "t('waNpcSeed')"],
  ["`已种子 ${chs.npc_seeds.length} 名 NPC，正在生成世界包…`", "`${t('waNpcSeeded')} ${chs.npc_seeds.length} ${t('waNpcSeeded2')}`"],
  ["'已取消'", "t('waCancelled')"],
  ["'设定已合并，正在生成世界包…'", "t('waMerged')"],
  ["'正在生成世界包草稿…'", "t('waGenDraft')"],
  ["'生成失败：'", "t('waGenFail')"],
  ["'未解析到 JSON，已把输出放进编辑框，请手动整理。'", "t('waNoJson')"],
  ["`草稿已生成：${v.pack.name}", "`${t('waDraftOk')}${v.pack.name}"],
  ["'草稿需修正：'", "t('waDraftNeedFix')"],
  ["'JSON 解析失败'", "t('waJsonFail')"],
  ["`校验通过：${v.pack.name}", "`${t('waValidateOk')}${v.pack.name}"],
  ["confirm('已存在同 id 世界包，覆盖保存？')", "confirm(t('waOverwrite'))"],
  ["|| '保存失败'", "|| t('waSaveFail')"],
  ["toast('世界包已保存：' + saved.pack.name)", "toast(t('waSaved') + saved.pack.name)"],
  ["'已导出到下方文本框，可复制保存。'", "t('waExported')"],
  ["confirm(`删除自定义世界「${id}」？其存档槽会保留，仅移除世界包。`)", "confirm(t('waDelConfirm') + id + t('waDelConfirm2'))"],
  ["value=\"奇幻冒险\"", "value=\"${t('waStyleDef')}\""],
  ["|| '奇幻冒险'", "|| t('waStyleDef')"],
])

rep('app/js/ui/settings-panels.js', [
  ['    <p>1. 在顶栏 <b>🔑 API</b> 配置自定义接口：Base URL + Key + 模型，协议选 <b>chat</b> 或 <b>response</b>。</p>',
   '    <p>1. ${t(\'helpP1\')} <b>🔑 API</b> ${t(\'helpP1b\')} <b>chat</b> ${t(\'helpP1c\')} <b>response</b>。</p>'],
  ['    <p>2. 在 <b>当前场景</b> 选择行动或输入自由行动，由 AI 实时生成剧情与数据变化。</p>',
   '    <p>2. ${t(\'helpP2\')} <b>${t(\'navScene\')}</b> ${t(\'helpP2b\')}</p>'],
  ['    <p>3. 攒够 <b>${esc(pack ? pack.lexicon.progress : \'进度\')}</b> 后点 <b>${esc(ui.advanceBtn)}</b> 提升${esc(pack ? pack.lexicon.level : \'等级\')}。</p>',
   '    <p>3. ${t(\'helpP3\')} <b>${esc(pack ? pack.lexicon.progress : t(\'progressWord\'))}</b> ${t(\'helpP3b\')} <b>${esc(ui.advanceBtn)}</b> ${t(\'helpP3c\')}${esc(pack ? pack.lexicon.level : t(\'levelWord\'))}。</p>'],
  ['    <p>4. <b>🌐 世界观</b> 切换世界；各世界存档独立，切换即读档。</p>',
   '    <p>4. <b>🌐 ${t(\'worlds\')}</b> ${t(\'helpP4\')}</p>'],
  ['    <p>5. 顶栏 <b>🔑 API</b> 可配置/切换多组接口；Key 保存在本机，删档会保留。</p>',
   '    <p>5. ${t(\'api\')} <b>🔑</b> ${t(\'helpP5\')}</p>'],
  ['协议说明：chat → /chat/completions；response → /responses。内容由 AI 生成；存档在本机。API Key 加密保存：桌面版走系统 safeStorage，安卓版走 Android Keystore，均不落明文。',
   "${t('helpProto')}"],
])

console.log('done')
