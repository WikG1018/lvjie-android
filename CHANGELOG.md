# Changelog

本项目版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)，记录格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.3] - 2025-07

### Added
- 完整界面 UI 多语言：简体中文 / 繁體中文 / English / 日本語
- 欢迎页「🌐 语言」入口，新开局继承全局语言偏好
- 双语 README、LICENSE（MIT）、CHANGELOG

### Security
- API Key 安卓端改为 Android Keystore AES-256-GCM 加密；堵死明文 localStorage 回退
- HTTP 桥 SSRF 防护、跨 origin 重定向剥离认证头、toast XSS 转义
- 三审批修：Key 空写覆盖、recover 竞态、progress 白名单、流式串扰

## [0.0.2.1] - 2025-06

### Fixed
- 婚姻性别规则与场景 NPC 性别显示
- NPC 点名档案
- 独立审查问题批修（Key / API 保存 / MIDI / 弹窗 / 恩怨 / 任务 / 流式）

## [0.0.2] - 2025-05

### Added
- 恩怨手动增删；负好感自动写入恩怨 / 仇人
- NPC 关系网双向同步与界面展示
- 流式输出、changes 熔断与存档导出导入
- 书籍人物考据并种子为游戏 NPC
- 自定义世界：JSON 导入 / 从书 AI 生成 / 联网补充设定
- 世界观切换改为独立存档槽

### Fixed
- XSS 与 Electron 安全面加固
- 联网补充改为国内信源优先

## [0.0.1] - 2025-04

### Added
- 初版：六世界观、自定义模型接入、事件循环与 JSON changes 落库
- 委托任务、背景音乐（mp3 / MIDI）、人物记忆
- Windows 便携包与 Android APK 发布

[Unreleased]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.2.1...v0.0.3
[0.0.2.1]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.2.1
[0.0.2]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.2
[0.0.1]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.1
