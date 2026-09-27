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
      console.log('MISS', String(a).slice(0, 50).replace(/\n/g, '\\n'))
    }
  }
  fs.writeFileSync(p, t)
  console.log(file, 'replaced', n)
}

// ===== i18n 补键 =====
{
  const p = path.resolve('app/js/engine/i18n.js')
  let t = fs.readFileSync(p, 'utf8')
  const keys = `    hereMark: '· 当前',
    questMark: '📜任务',
    here: '当前',
    aboutDays: '约 ',
    days: '天',
    faceTalk: '当面交谈',
    msg: '传讯',
    chat: '交谈',
    needSameScene: '需在同一场景',
    needSameSceneLong: '；需在同一场景才能当面交谈',
    notNearby: '不在附近',
    talkDaily: '每天最多与同一位',
    talkTimes: '交谈',
    times: '次',
    talkRemoteHint: '；不在同一场景可「传讯」',
    grudgeKindYuan: '怨',
    grudgeKindEn: '恩',
    grudgeKindChou: '仇',
    grudgeKindZhai: '债',
    questGiver: '委托人：',
    objectives: '目标：',
    rewardLabel: '奖励：',
    progressLabel: '进度：',
    doneN2: '已完成',
    failedN2: '失败',
    value: '价值',
    useBtn: '使用',
    aiBtn: 'AI 互动',
    learnBtn: '研习',
    sellBtn: '出售',
    emptyBag: '背包空空如也',
    noEffect: '使用后暂无效果',
    alreadyKnown: '已经会了',
    useItemFlow: '使用物品',
    addedMusic: '已添加',
    songs: '首本地音乐',
    noMusicAdded: '未添加（仅支持 mp3/wav/ogg/m4a/mid）',
    exported: '已导出存档（不含 API Key）',
    importFail: '导入失败',
    imported: '已导入',
    worldSaves: '个世界存档',
    jsonFail: 'JSON 解析失败',
    resetTitle: '重置存档？',
    confirmReset: '确认重置',
    msgFlow: '传讯',
    chatFlow: '交谈',
    herePlace: '此处',
    memNone: '无',
`
  if (!t.includes("hereMark:")) {
    t = t.replace("    quickStart: '快捷',", "    quickStart: '快捷',\n" + keys)
    fs.writeFileSync(p, t)
    console.log('i18n keys added')
  }
}

rep('app/js/ui/render.js', [
  ["${cur ? '· 当前' : ''}${markers.get(l.name) ? ' <span class=\"ctype\">📜任务</span>' : ''}",
   "${cur ? t('hereMark') : ''}${markers.get(l.name) ? ' <span class=\"ctype\">' + t('questMark') + '</span>' : ''}"],
  ["${cur ? '当前' : '约 ' + days + ' 天'}",
   "${cur ? t('here') : t('aboutDays') + days + t('days')}"],
  ['title="${at.here ? \'当面交谈\' : (feat.talkRemote ? \'远程传讯\' : \'需在同一场景\')}">${at.here ? \'交谈\' : (feat.talkRemote ? \'传讯\' : \'不在附近\')}</button>',
   'title="${at.here ? t(\'faceTalk\') : (feat.talkRemote ? t(\'msg\') : t(\'needSameScene\'))}">${at.here ? t(\'chat\') : (feat.talkRemote ? t(\'msg\') : t(\'notNearby\'))}</button>'],
  ["每天最多与同一位${esc(pack.lexicon.companion)}交谈 ${MAX_TALK_PER_DAY} 次${feat.talkRemote ? '；不在同一场景可「传讯」' : '；需在同一场景才能当面交谈'}",
   "${t('talkDaily')}${esc(pack.lexicon.companion)}${t('talkTimes')} ${MAX_TALK_PER_DAY} ${t('times')}${feat.talkRemote ? t('talkRemoteHint') : t('needSameSceneLong')}"],
  ['<option value="怨">怨</option>', '<option value="怨">${t(\'grudgeKindYuan\')}</option>'],
  ['<option value="恩">恩</option>', '<option value="恩">${t(\'grudgeKindEn\')}</option>'],
  ['<option value="仇">仇</option>', '<option value="仇">${t(\'grudgeKindChou\')}</option>'],
  ['<option value="债">债</option>', '<option value="债">${t(\'grudgeKindZhai\')}</option>'],
  ["        '传讯',", "        t('msg'),"],
  ["        '交谈',", "        t('chat'),"],
  ['委托人：', "${t('questGiver')}"],
  ['目标：', "${t('objectives')}"],
  ['奖励：', "${t('rewardLabel')}"],
  ['进度：', "${t('progressLabel')}"],
  ['已完成 ${done.length}', "${t('doneN2')} ${done.length}"],
  ['失败 ${failed.length}', "${t('failedN2')} ${failed.length}"],
  ['价值 ${fmtNum(it.price)}', "${t('value')} ${fmtNum(it.price)}"],
  ['>使用</button>', '>${t(\'useBtn\')}</button>'],
  ['>AI 互动</button>', '>${t(\'aiBtn\')}</button>'],
  ['>研习</button>', '>${t(\'learnBtn\')}</button>'],
  ['>出售</button>', '>${t(\'sellBtn\')}</button>'],
  ["|| '<div class=\"empty\">背包空空如也</div>'}", '|| `<div class="empty">${t(\'emptyBag\')}</div>`}'],
  ["api.toast('使用后暂无效果')", "api.toast(t('noEffect'))"],
  ["api.toast('已经会了')", "api.toast(t('alreadyKnown'))"],
  ["api.startFlow('使用物品',", "api.startFlow(t('useItemFlow'),"],
  ["api.toast('已添加 ' + added.length + ' 首本地音乐')", "api.toast(t('addedMusic') + ' ' + added.length + t('songs'))"],
  ["api.toast('未添加（仅支持 mp3/wav/ogg/m4a/mid）')", "api.toast(t('noMusicAdded'))"],
  ["api.toast('已导出存档（不含 API Key）')", "api.toast(t('exported'))"],
  ["api.toast(r.error || '导入失败')", "api.toast(r.error || t('importFail'))"],
  ["api.toast('已导入 ' + r.count + ' 个世界存档')", "api.toast(t('imported') + ' ' + r.count + t('worldSaves'))"],
  ["api.toast('JSON 解析失败')", "api.toast(t('jsonFail'))"],
  ['<h2>重置存档？</h2>', "<h2>${t('resetTitle')}</h2>"],
  ['>确认重置</button>', ">${t('confirmReset')}</button>"],
])

rep('app/js/main.js', [
  ["· 旅界`", "· ${t('brand')}`"],
  ["' · 旅界'", " + ' · ' + t('brand')"],
  ["'⚠ 寿限将尽'", "t('lifeWarnDefault')"],
  ['>年龄</span>', '>${t(\'age\')}</span>'],
  ['<h2>新开一局？</h2>', "<h2>${t('newGameTitle')}</h2>"],
  ['>取消</button>', '>${t(\'cancel\')}</button>'],
  ['>覆盖并新开</button>', '>${t(\'overwriteNew\')}</button>'],
  ["['初', '中', '高']", "[t('subI'), t('subMid'), t('subHi')]"],
])

rep('app/js/ui/settings-panels.js', [
  ["{ advanceBtn: '升级' }", "{ advanceBtn: t('advance') }"],
  ['<h2>帮助 · ${esc(pack ? pack.name : \'旅界\')}</h2>', "<h2>${t('helpTitle')}${esc(pack ? pack.name : t('brand'))}</h2>"],
  ['>知道了</button>', '>${t(\'ok\')}</button>'],
  ["'配置' + (i + 1)", "t('cfgN') + (i + 1)"],
  ["拉取失败：", "t('fetchFailPrefix')"],
  ["'自定义'", "t('selfDefault')"],
])

console.log('done')
