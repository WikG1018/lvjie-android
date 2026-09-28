# Changelog

本项目版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)，记录格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.0.7.1] - 2025-09

### Fixed
- 选项去掉重复序号，不再显示「1. 1.xxx」

## [0.0.7] - 2025-09

### Added
- 婚姻：末世开启；取向（不限/女/男）；求婚成功/婉拒均走 AI 剧情
- NPC 年龄（age_days）与展示；求婚确认改应用内弹窗
- 货币四档（下/中/上/极品）：修仙灵晶、玄幻灵石、武侠西幻金银铜、现代元、自定义原设定
- 付款高抵低 1:100 并找零；极品持有后才显示；不自动进位
- BGM 全局偏好持久化；多 API Key 按协议分条保存

### Fixed
- Response 流式过滤思考链；chat 连续轮 JSON 回放防丢数据块
- MIDI 安卓播放（asset.read 回退 + 本地服 URL 解码中文文件名）
- 生成剧情滚回整页顶部；render ageLabel 导入崩溃

## [0.0.6] - 2025-09

### Added
- 自定义世界生成可视化进度：步骤状态 / 计时 / 失败标红 / 长任务心跳
- 生成失败可从断点续接（缓存设定圣经与出包上下文）
- 联网补充扩展：萌娘相关页、Bangumi、AniList、Fandom / 灰机（失败自动跳过）
- 萌娘检索改用 opensearch（修复 list=search 401）

### Fixed
- 流式只展示 narrative 并反转义，消除 JSON 与字面换行转义刷屏、结束跳变
- 自定义世界 Key 走引擎仓；丹药等赠品识别与兜底落库
- 游戏事件输出改为单一 JSON 对象 + response_format 强制，杜绝漏数据块
- 生成按钮与婚姻提示去掉 UI 历史说明，只留操作指引

## [0.0.5] - 2025-07

### Added
- Responses API previous_response_id 服务端对话链，断链自动回退全量历史
- 界面 UI 多语言：简体中文 / 繁體中文 / English / 日本語
- 欢迎页语言切换；各世界观 startBtn 多语言；开局弹窗设角色名与初始年龄
- 婚姻侧栏（按世界观用词）；常驻自由行动输入框
- 自定义世界支持游戏/动画/漫画/影视，维基为独立可选信源
- 生成失败自动重连（最多 3 次）；Android 真流式 SSE 输出

### Fixed
- API Key 双缓存打通，resolveKey 回退全局密钥仓
- 事件并发闸误用 loading 导致 AI 一直「叙事中」
- 流式回调注册顺序竞态、8s 快退误伤进行中输出
- 欢迎页与游戏界面重叠；新地图自动落位；同据点路程 1 天
- BGM 后台暂停、回前台防叠音；对话上下文完整回放

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

[Unreleased]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.7.1...HEAD
[0.0.7.1]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.7...v0.0.7.1
[0.0.7]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.3...v0.0.5
[0.0.3]: https://github.com/Fly143/LvJie-WanJie/compare/v0.0.2.1...v0.0.3
[0.0.2.1]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.2.1
[0.0.2]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.2
[0.0.1]: https://github.com/Fly143/LvJie-WanJie/releases/tag/v0.0.1
