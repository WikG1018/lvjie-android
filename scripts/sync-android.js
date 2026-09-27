#!/usr/bin/env node
// 把桌面端 app/ 同步进 Android WebView 资源（复用同一套游戏代码）
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, 'app')
const dest = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'www')

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, ent.name)
    const d = path.join(to, ent.name)
    if (ent.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

fs.rmSync(dest, { recursive: true, force: true })
copyDir(src, dest)

// 资源（音乐/图标）
const assetsSrc = path.join(root, 'assets')
const assetsDst = path.join(dest, 'assets')
if (fs.existsSync(assetsSrc)) {
  copyDir(assetsSrc, assetsDst)
}

console.log('android assets synced →', dest)
