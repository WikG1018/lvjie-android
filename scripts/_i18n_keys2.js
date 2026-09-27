const fs = require('fs')
const p = 'app/js/engine/i18n.js'
let t = fs.readFileSync(p, 'utf8')
const add = `    needSameScene: '需在同一场景',
    needSameSceneLong: '；需在同一场景才能当面交谈',
    notNearby: '不在附近',
    rewardLabel: '奖励：',
    progressLabel: '进度：',
    doneN2: '已完成',
    failedN2: '失败',
    youUse2: '」：',
    discardQ: '卖不出价钱，确认直接丢弃？',
    sellQ1: '出售',
    sellQ3: '？',
    soldA: '售出',
    resetWarnA: '将删除《',
    resetWarnB: '》这一世界的进度并回到选择页。其它世界存档与 API Key 保留。',
`
if (t.indexOf('needSameScene:') >= 0) {
  console.log('exist')
} else {
  t = t.replace("    subHi: '高',", "    subHi: '高',\n" + add)
  fs.writeFileSync(p, t)
  console.log('added')
}
