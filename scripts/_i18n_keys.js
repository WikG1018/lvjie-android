const fs = require('fs')
const p = 'app/js/engine/i18n.js'
let t = fs.readFileSync(p, 'utf8')
if (t.indexOf('noBonusHint:') >= 0) {
  console.log('exist')
  process.exit(0)
}
const add = `    noBonusHint: '无品级/档位，不计入战力',
    typesN: '类',
    noBonus: '无加成',
    learnOkA: '研习《',
    learnOkB: '》成功',
    youMsgA: '我通过现有联络方式联系「',
    youMsgB: '」（对方在',
    youMsgC: '）。背景：',
    youMsgD: '。记忆：',
    youMsgE: '。注意这是远距离联络，当面才能做需要碰面的事。',
    youChatA: '我在',
    youChatB: '与「',
    youChatC: '」当面交谈。背景：',
    herePlace: '此处',
    memNone: '无',
    questsNav: '任务',
    overwriteA: '将覆盖《',
    overwriteB: '》的现有存档',
    otherKeeps: '。其它世界存档与 API Key 不受影响。',
    successDef: '成功',
    taglineDef: 'AI 驱动的多世界观开放世界',
`
t = t.replace("    subHi: '高',", "    subHi: '高',\n" + add)
fs.writeFileSync(p, t)
console.log('added')
