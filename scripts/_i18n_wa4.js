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
      console.log('MISS', String(a).slice(0, 55).replace(/\n/g, ' '))
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
    ['evKind', '事件'],
    ['freeActionFlow', '自由行动'],
    ['typesN', '类'],
    ['unequipBtn', '卸下'],
    ['noBonus', '无加成'],
    ['learnOkA', '研习《'],
    ['learnOkB', '》成功'],
    ['soldEq', '已装备，确认出售后将卸下？'],
    ['discardQ', '卖不出价钱，确认直接丢弃？'],
    ['sellQ1', '出售'],
    ['sellQ2', '，约得'],
    ['sellQ3', '？'],
    ['soldA', '售出'],
    ['resetWarnA', '将删除《'],
    ['resetWarnB', '》这一世界的进度并回到选择页。其它世界存档与 API Key 保留。'],
    ['successDef', '成功'],
    ['taglineDef', 'AI 驱动的多世界观开放世界'],
    ['questsNav', '任务'],
    ['overwriteA', '将覆盖《'],
    ['overwriteB', '》的现有存档'],
    ['otherKeeps', '。其它世界存档与 API Key 不受影响。'],
    ['youUse', '我使用「'],
    ['youUse2', '」：'],
    ['youMsgA', '我通过现有联络方式联系「'],
    ['youMsgB', '」（对方在'],
    ['youMsgC', '）。背景：'],
    ['youMsgD', '。记忆：'],
    ['youMsgE', '。注意这是远距离联络，当面才能做需要碰面的事。'],
    ['youChatA', '我在'],
    ['youChatB', '与「'],
    ['youChatC', '」当面交谈。背景：'],
    ['herePlace', '此处'],
    ['memNone', '无'],
    ['genderPrefix', '性别：'],
    ['talkBtn', '交谈'],
    ['fightBtn', '挑战'],
    ['needSameSceneBtn', '需在同一场景'],
  ]
  if (!t.includes('evKind:')) {
    let block = ''
    for (const [k, v] of extra) {
      const vv = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      block += `    ${k}: '${vv}',\n`
    }
    t = t.replace("    subHi: '高',", "    subHi: '高',\n" + block)
    fs.writeFileSync(p, t)
    console.log('keys ok')
  }
}

rep('app/js/ui/render.js', [
  ["esc(EV.kind || '事件')", "esc(EV.kind || t('evKind'))"],
  ["pack.ui && pack.ui.talkBtn || '交谈'", "pack.ui && pack.ui.talkBtn || t('talkBtn')"],
  ["pack.ui && pack.ui.fightBtn || '挑战'", "pack.ui && pack.ui.fightBtn || t('fightBtn')"],
  ["api.startFlow('自由行动', content)", "api.startFlow(t('freeActionFlow'), content)"],
  ['${S.inventory.length} 类</span>', '${S.inventory.length} ${t(\'typesN\')}</span>'],
  ["it.equipped ? '卸下' : '装备'", "it.equipped ? t('unequipBtn') : t('equipBtn')"],
  ['>无加成</span>', '>${t(\'noBonus\')}</span>'],
  ["api.toast(`研习《${rec.name}》成功`)", "api.toast(t('learnOkA') + rec.name + t('learnOkB'))"],
  ["api.startFlow(t('useItemFlow'), `我使用「${it.name}」：${it.desc || ''}`)", "api.startFlow(t('useItemFlow'), t('youUse') + it.name + t('youUse2') + (it.desc || ''))"],
  ["if (!confirm('「' + it.name + '」已装备，确认出售后将卸下？')) return", "if (!confirm('「' + it.name + '」' + t('soldEq'))) return"],
  ["if (!confirm('「' + it.name + '」卖不出价钱，确认直接丢弃？')) return", "if (!confirm('「' + it.name + '」' + t('discardQ'))) return"],
  ["} else if (!confirm('出售 ' + it.name + '，约得 ' + gain + '？')) {", "} else if (!confirm(t('sellQ1') + ' ' + it.name + t('sellQ2') + ' ' + gain + t('sellQ3'))) {"],
  ["api.toast(`售出 ${it.name}，+${fmtNum(gain)} ${pack.lexicon.money.main}`)", "api.toast(t('soldA') + ' ' + it.name + '，+' + fmtNum(gain) + ' ' + pack.lexicon.money.main)"],
  ['将删除《${esc(pack.name)}》这一世界的进度并回到选择页。其它世界存档与 API Key 保留。', "${t('resetWarnA')}${esc(pack.name)}${t('resetWarnB')}"],
  ["`我通过现有联络方式联系「${f.name}」（对方在${at.name}）。背景：${f.intro || ''}。记忆：${f.mem || '无'}。注意这是远距离联络，当面才能做需要碰面的事。`", "t('youMsgA') + f.name + t('youMsgB') + at.name + t('youMsgC') + (f.intro || '') + t('youMsgD') + (f.mem || t('memNone')) + t('youMsgE')"],
  ["`我在${cur.name || '此处'}与「${f.name}」当面交谈。背景：${f.intro || ''}。记忆：${f.mem || '无'}`", "t('youChatA') + (cur.name || t('herePlace')) + t('youChatB') + f.name + t('youChatC') + (f.intro || '') + t('youMsgD') + (f.mem || t('memNone'))"],
])

rep('app/js/main.js', [
  ["ui.advanceSuccessTitle || '成功'", "ui.advanceSuccessTitle || t('successDef')"],
  ["getPack(sel).welcomeSub || getPack(sel).tagline || 'AI 驱动的多世界观开放世界'", "getPack(sel).welcomeSub || getPack(sel).tagline || t('taglineDef')"],
  ["pp.gameTitle || pp.name || '旅界'", "pp.gameTitle || pp.name || t('brand')"],
  ['将覆盖《${esc(getPack(id).name)}》的现有存档${slot ? `（${esc(slot.name)} · ${esc(slot.levelText || \'\')}）` : \'\'}。其它世界存档与 API Key 不受影响。', "${t('overwriteA')}${esc(getPack(id).name)}${t('overwriteB')}${slot ? `（${esc(slot.name)} · ${esc(slot.levelText || '')}）` : ''}${t('otherKeeps')}"],
  ["quests: (nav && nav.quests) || '任务',", "quests: (nav && nav.quests) || t('questsNav'),"],
])

console.log('done')
