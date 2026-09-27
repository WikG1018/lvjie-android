// 启动错误提示（无 inline script，避免 CSP 拦截）
(function () {
  function show(msg) {
    var box = document.getElementById('aw-errbox')
    if (!box) {
      box = document.createElement('div')
      box.id = 'aw-errbox'
      box.style.cssText = 'display:block;position:fixed;left:8px;right:8px;top:8px;z-index:9999;background:#400;color:#fff;padding:10px;font:12px/1.4 monospace;border-radius:8px'
      document.documentElement.appendChild(box)
    } else {
      box.style.display = 'block'
    }
    box.textContent = String(msg)
  }
  window.addEventListener('error', function (e) {
    show('JS错误: ' + (e.message || e.type) + ' @' + (e.filename || '') + ':' + (e.lineno || ''))
  })
  window.addEventListener('unhandledrejection', function (e) {
    show('Promise错误: ' + ((e.reason && e.reason.message) || e.reason || e.type))
  })
  document.addEventListener('DOMContentLoaded', function () {
    var w = document.getElementById('welcome')
    if (w && w.hidden && (!document.getElementById('app') || document.getElementById('app').hidden)) {
      show('界面未初始化：欢迎层与游戏层均隐藏')
    }
  })
})()
