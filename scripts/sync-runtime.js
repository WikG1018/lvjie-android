// 把 app/ 与 main.js/preload.js 同步进 runtime/resources/app/
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const srcApp = path.join(root, 'app')
const srcMain = path.join(root, 'main.js')
const srcPreload = path.join(root, 'preload.js')
const srcAssets = path.join(root, 'assets')
const dest = path.join(root, 'runtime', 'resources', 'app')

const rootPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

// 先清空再同步，避免已删除文件残留在发布物
fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })
fs.cpSync(srcApp, dest, { recursive: true })
fs.copyFileSync(srcMain, path.join(dest, 'main.js'))
if (fs.existsSync(srcPreload)) {
  fs.copyFileSync(srcPreload, path.join(dest, 'preload.js'))
}
if (fs.existsSync(srcAssets)) {
  fs.mkdirSync(path.join(dest, 'assets'), { recursive: true })
  fs.cpSync(srcAssets, path.join(dest, 'assets'), { recursive: true })
}
fs.writeFileSync(
  path.join(dest, 'package.json'),
  JSON.stringify({
    name: rootPkg.name || 'agent-worlds',
    productName: rootPkg.productName || '旅界',
    version: rootPkg.version || '0.0.0',
    main: 'main.js'
  }, null, 2)
)
console.log('synced →', dest)
