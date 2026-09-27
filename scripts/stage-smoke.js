// 用本项目 runtime/（或 AW_ELECTRON_RUNTIME）stage 并冒烟新 app
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.join(__dirname, '..')
const ELECTRON_SRC = process.env.AW_ELECTRON_RUNTIME
  || (fs.existsSync(path.join(ROOT, 'runtime', 'AgentWorlds.exe')) ? path.join(ROOT, 'runtime') : null)
  || (fs.existsSync(path.join(ROOT, 'runtime')) ? path.join(ROOT, 'runtime') : null)
const STAGE = path.join(ROOT, '.smoke-stage')

if (!ELECTRON_SRC || !fs.existsSync(ELECTRON_SRC)) {
  console.error('未找到 Electron 运行时。请设置 AW_ELECTRON_RUNTIME 或准备 runtime/')
  process.exit(1)
}

const EXE_NAME = fs.existsSync(path.join(ELECTRON_SRC, 'AgentWorlds.exe'))
  ? 'AgentWorlds.exe'
  : fs.readdirSync(ELECTRON_SRC).find(n => /agent.*\.exe$/i.test(n) || n === 'electron.exe')
if (!EXE_NAME) {
  console.error('运行时目录下未找到可执行文件:', ELECTRON_SRC)
  process.exit(1)
}

function rimraf(p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true })
}

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))

rimraf(STAGE)
fs.mkdirSync(path.join(STAGE, 'resources', 'app'), { recursive: true })

for (const ent of fs.readdirSync(ELECTRON_SRC, { withFileTypes: true })) {
  if (ent.name === 'resources') continue
  const s = path.join(ELECTRON_SRC, ent.name)
  const d = path.join(STAGE, ent.name === EXE_NAME ? 'AgentWorlds.exe' : ent.name)
  if (ent.isDirectory()) copyDir(s, d)
  else fs.copyFileSync(s, d)
}

copyDir(path.join(ROOT, 'app'), path.join(STAGE, 'resources', 'app'))
fs.mkdirSync(path.join(STAGE, 'resources', 'app', 'assets'), { recursive: true })
fs.copyFileSync(path.join(ROOT, 'main.js'), path.join(STAGE, 'resources', 'app', 'main.js'))
if (fs.existsSync(path.join(ROOT, 'preload.js'))) {
  fs.copyFileSync(path.join(ROOT, 'preload.js'), path.join(STAGE, 'resources', 'app', 'preload.js'))
}
fs.writeFileSync(
  path.join(STAGE, 'resources', 'app', 'package.json'),
  JSON.stringify({
    name: rootPkg.name || 'agent-worlds',
    productName: rootPkg.productName || '旅界',
    version: rootPkg.version || '0.0.0',
    main: 'main.js'
  }, null, 2)
)
if (fs.existsSync(path.join(ROOT, 'assets'))) {
  copyDir(path.join(ROOT, 'assets'), path.join(STAGE, 'resources', 'app', 'assets'))
}

const r = spawnSync(path.join(STAGE, 'AgentWorlds.exe'), [], {
  env: { ...process.env, XX_SMOKE_TEST: '1' },
  encoding: 'utf8',
  timeout: 20000
})
const out = (r.stdout || '') + (r.stderr || '')
process.stdout.write(out)
const packsOk = /"packs"\s*:\s*6/.test(out) || /"packCards"\s*:\s*6/.test(out)
if (!packsOk) {
  console.error('SMOKE_FAIL')
  process.exit(1)
}
console.log('SMOKE_OK')
