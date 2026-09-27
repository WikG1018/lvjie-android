// 启动 旅界：使用本项目 runtime/ 下的完整 Electron 发行版
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const exe = path.join(root, 'runtime', 'AgentWorlds.exe')

if (!fs.existsSync(exe)) {
  console.error('runtime/AgentWorlds.exe 不存在，请先准备 runtime/（完整 Electron 发行版）')
  process.exit(1)
}

const env = Object.assign({}, process.env)
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(exe, process.argv.slice(2), {
  stdio: 'inherit',
  env,
  windowsHide: false,
  cwd: path.join(root, 'runtime')
})

child.on('error', (e) => {
  console.error('spawn error', e)
  process.exit(1)
})
child.on('close', (code) => process.exit(code == null ? 1 : code))
