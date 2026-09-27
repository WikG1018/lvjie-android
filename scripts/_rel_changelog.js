const fs = require('fs')
let t = fs.readFileSync('CHANGELOG.md', 'utf8')
const old = `## [Unreleased]

### Added
- 完整界面 UI 多语言：简体中文 / 繁體中文 / English / 日本語
- 欢迎页「🌐 语言」入口，新开局继承全局语言偏好

### Security
- API Key 安卓端改为 Android Keystore AES-256-GCM 加密；堵死明文 localStorage 回退
- HTTP 桥 SSRF 防护、跨 origin 重定向剥离认证头、toast XSS 转义
`
const neu = `## [Unreleased]

## [0.0.3] - 2025-07

### Added
- 完整界面 UI 多语言：简体中文 / 繁體中文 / English / 日本語
- 欢迎页「🌐 语言」入口，新开局继承全局语言偏好
- 双语 README、LICENSE（MIT）、CHANGELOG

### Security
- API Key 安卓端改为 Android Keystore AES-256-GCM 加密；堵死明文 localStorage 回退
- HTTP 桥 SSRF 防护、跨 origin 重定向剥离认证头、toast XSS 转义
- 三审批修：Key 空写覆盖、recover 竞态、progress 白名单、流式串扰
`
if (!t.includes(old)) { console.log('NOT FOUND'); process.exit(1) }
t = t.split(old).join(neu)
t = t.replace('[Unreleased]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.2.1...HEAD',
  '[Unreleased]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.3...HEAD\n[0.0.3]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.2.1...v0.0.3')
fs.writeFileSync('CHANGELOG.md', t)
console.log('changelog ok')
