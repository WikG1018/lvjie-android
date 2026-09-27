// 用官方 Electron 发行版重建 runtime/
// 来源：node_modules/electron/dist 或 AW_ELECTRON_DIST 或 AW_ELECTRON_ZIP
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const RUNTIME = path.join(ROOT, 'runtime')
const APP_DEST = path.join(RUNTIME, 'resources', 'app')

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

function resolveDist() {
  if (process.env.AW_ELECTRON_DIST && fs.existsSync(process.env.AW_ELECTRON_DIST)) {
    return process.env.AW_ELECTRON_DIST
  }
  const zip = process.env.AW_ELECTRON_ZIP
  if (zip && fs.existsSync(zip)) {
    const os = require('os')
    const ex = path.join(os.tmpdir(), 'aw-electron-dist-' + Date.now())
    fs.rmSync(ex, { recursive: true, force: true })
    fs.mkdirSync(ex, { recursive: true })
    console.log('解压', zip)
    execFileSync('powershell', [
      '-NoProfile', '-Command',
      `Expand-Archive -Path '${zip.replace(/'/g, "''")}' -DestinationPath '${ex.replace(/'/g, "''")}' -Force`
    ], { stdio: 'inherit' })
    return ex
  }
  const local = path.join(ROOT, 'node_modules', 'electron', 'dist')
  if (fs.existsSync(path.join(local, 'electron.exe'))) return local
  return null
}

const dist = resolveDist()
if (!dist) fail('未找到 Electron dist。可设 AW_ELECTRON_DIST / AW_ELECTRON_ZIP，或先 npm install electron')
if (!fs.existsSync(path.join(dist, 'electron.exe'))) fail('dist 下缺少 electron.exe: ' + dist)
const verPath = path.join(dist, 'version')
const ver = fs.existsSync(verPath) ? fs.readFileSync(verPath, 'utf8').trim() : ''
console.log('来源 dist:', dist, 'version:', ver || '(missing)')

// 清空 runtime（保留无关用户文件风险低：本目录仅为发布物）
fs.rmSync(RUNTIME, { recursive: true, force: true })
fs.mkdirSync(RUNTIME, { recursive: true })

for (const ent of fs.readdirSync(dist, { withFileTypes: true })) {
  if (ent.name === 'resources') continue
  const s = path.join(dist, ent.name)
  const d = path.join(RUNTIME, ent.name === 'electron.exe' ? 'AgentWorlds.exe' : ent.name)
  if (ent.isDirectory()) fs.cpSync(s, d, { recursive: true })
  else fs.copyFileSync(s, d)
}

// 同步应用
const { spawnSync } = require('child_process')
const r = spawnSync(process.execPath, [path.join(__dirname, 'sync-runtime.js')], { stdio: 'inherit' })
if (r.status !== 0) fail('sync-runtime 失败')

// 写入可追溯版本文件
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
fs.writeFileSync(path.join(RUNTIME, 'version'), (ver || rootPkg.devDependencies.electron || 'unknown') + '\n')
fs.writeFileSync(
  path.join(RUNTIME, 'PROVENANCE.txt'),
  [
    'electron_version=' + (ver || 'unknown'),
    'source=' + dist,
    'package_electron=' + (rootPkg.devDependencies && rootPkg.devDependencies.electron),
    'rebuilt_at=' + new Date().toISOString(),
    'note=AgentWorlds.exe is electron.exe renamed; window icon set in main.js'
  ].join('\n') + '\n'
)

fs.writeFileSync(
  path.join(RUNTIME, 'README.md'),
  [
    '# 旅界 · runtime',
    '',
    '本目录是**官方 Electron 发行版**（见 `version` / `PROVENANCE.txt`）+ 同步后的游戏本体。',
    '',
    '- 启动：`npm start` → `runtime/AgentWorlds.exe`',
    '- 游戏本体在 `runtime/resources/app/`（由 `app/` + `main.js` + `preload.js` + `assets/` 同步）',
    '- 重建：`node scripts/rebuild-runtime.js`（可设 `AW_ELECTRON_ZIP` 指向官方 zip）',
    '- 不要把 `node_modules/electron` 整包拷进来当 runtime',
    ''
  ].join('\n')
)

console.log('runtime rebuilt →', RUNTIME)
