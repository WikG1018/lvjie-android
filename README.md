<div align="center">

# 旅界（LvJie）

**AI 驱动的多世界观开放世界文字游戏**

[简体中文](README.md) · [English](README.en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Android-blue.svg)](https://github.com/Fly143/LvJie-WanJie/releases)
[![Release](https://img.shields.io/github/v/release/Fly143/LvJie-WanJie?include_prereleases)](https://github.com/Fly143/LvJie-WanJie/releases)
[![Electron](https://img.shields.io/badge/Electron-33-47848f.svg)](https://www.electronjs.org/)

选择修仙 / 玄幻 / 武侠 / 职场 / 末世 / 西幻，接入自定义大模型 API，实时生成剧情与数据变化。

</div>

---

## 功能

- 六套完整世界观包：等级表、货币、场景行动、升级动词、主题皮肤、AI 铁律
- **自定义世界包**：JSON 导入，或按书名/设定用 AI 生成草稿（欢迎页「🛠 自定义世界」）
- 自定义模型接入：Base URL + API Key + 模型，协议支持 **chat** / **response**
- 可「刷新模型列表」从 `GET {Base URL}/models` 拉取选用
- 事件循环：行动 / 选项 / 自由输入 → JSON `changes` 自动落库（货币、进度、物品、地图、同伴、任务）
- 委托任务可追踪：接取/完成/失败进侧栏「任务」，奖励同步写入数值
- 背景音乐支持 mp3 与 **MIDI**（Web Audio 合成）
- chat 协议流式输出；changes 单轮数值熔断；设置里可导出/导入存档 JSON（不含 Key）
- 人物记忆：同伴/场景 NPC 进存档；点名找人时按需注入档案
- **界面多语言**：简体中文 / 繁體中文 / English / 日本語
- 按世界观独立存档槽，切换世界即读档
- API Key 加密保存（桌面 safeStorage / 安卓 Android Keystore），不入存档

## 目录

| 路径 | 说明 |
|------|------|
| `app/` | 游戏本体（HTML/CSS/ESM JS） |
| `app/js/engine/` | 引擎：存档、进度、背包、地图、提示词、LLM、i18n |
| `app/js/engine/book-ingest.js` | 整本抽样与设定合并 |
| `app/js/engine/book-web.js` | 联网补充（维基/设定页） |
| `app/js/engine/worldpack.js` | 声明式世界包 schema（校验 / 草稿提示词） |
| `app/js/engine/custom-packs.js` | 自定义世界包存取 |
| `app/js/worldviews/` | 内置世界观包（词表 / 数值 / 地图 / 规则） |
| `main.js` / `preload.js` | Electron 主进程 / 渲染桥 |
| `android/` | Android WebView 壳（与 `app/` 共用引擎） |
| `runtime/` | 官方 Electron 发行版 + 同步后的游戏本体（**不入库**） |
| `scripts/` | 启动、同步/重建 runtime、冒烟脚本 |

## 运行

### Windows（免构建）

从 [Releases](https://github.com/Fly143/LvJie-WanJie/releases) 下载 `LvJie-*-win-x64.zip`，解压后双击 **`AgentWorlds.exe`**。

### Linux / 开发机（免打包）

```bash
npm install
npx electron .
```

（`electron` 仅开发依赖；游戏本体为原生 ESM，无 bundler。）

### Windows 本地从源码启动

```bash
npm start    # 同步 app/ → runtime/resources/app/ 并拉起 AgentWorlds.exe
```

若缺少 `runtime/`：`npm run rebuild:runtime`（可用 `AW_ELECTRON_ZIP` 指定官方 Electron zip）。

开发中只更新资源：`npm run sync`

## API 配置

顶栏 **🔑 API**：

1. 选择协议
   - `chat` → `POST {Base URL}/chat/completions`
   - `response` → `POST {Base URL}/responses`
2. 填写 Base URL、模型名、API Key
3. 需要时点 **刷新模型列表**（`GET {Base URL}/models`）

不附带任何内置 Key。Key 优先经系统安全存储加密落盘，不会写入存档 JSON。

## 自定义世界

欢迎页 **🛠 自定义世界**：

1. **从作品生成**：填书名 + 设定摘要（可选等级表），用已配置的 API 生成世界包草稿
2. **整本小说**：上传/粘贴 TXT，自动抽样开头/中段/结尾章节考据 → 合并设定 → 生成草稿
3. **联网补充**：优先萌娘百科/百度百科，可选维基回退；或粘贴设定帖 URL 抓正文
4. **人物 NPC**：从考据选出主要人物，生成 8~12 个带档案的 `map.people` 种子
5. **粘贴 JSON**：按 `worldpack.js` 字段校验后保存
6. 自定义世界出现在欢迎页，拥有独立存档槽；可导出 JSON 分享

## 世界观一览

| 包 | 升级 | 进度 | 场景示例 |
|----|------|------|----------|
| 修仙 | 突破 | 修为 | 游历、除妖、打坐 |
| 玄幻 | 破境 | 灵力 | 闯荡、挑战、吐纳 |
| 武侠 | 精进 | 内力 | 闯江湖、切磋、运功 |
| 职场 | 晋升 | 声望经验 | 谈判、社交、找机会 |
| 末世 | 进化 | 进化点 | 搜刮、狩猎、守夜 |
| 西幻 | 晋阶 | 魔力/经验 | 冒险、讨伐、冥想 |

## 从源码构建

本仓库 `master` 同时包含 **Windows 桌面** 与 **Android** 工程。

### Windows 可执行 / 便携包

```bash
npm install                # 可选，仅 electron devDependency
npm run rebuild:runtime    # 或自备 runtime/（Electron 发行版）
npm start                  # 同步 app/ 并启动
# 便携 zip：把 runtime/ 整目录打包即可
```

### Android APK

```bash
node scripts/sync-android.js   # 把 app/ 同步进 android assets
cd android
# 需 JDK17 + Android SDK 35（设置 JAVA_HOME / ANDROID_HOME）
gradlew.bat assembleRelease
# 产物：android/app/build/outputs/apk/release/app-release.apk
```

## 脚本

```bash
npm install           # 安装依赖
npm start             # 同步 runtime 并启动
npm run sync          # 仅同步 app → runtime/resources/app
npm run rebuild:runtime
npm run smoke:engine
npm run smoke:book
npm run smoke:llm
npm run smoke:stage
```

## 注意

- 游戏进度按世界观分槽存 localStorage，清站点/应用数据会丢档
- API Key 单独加密保存；删某一世界档会保留 Key 与其它世界存档
- 剧情由 AI 生成，可能包含虚构或错误内容

## 许可

[MIT](LICENSE) © Fly143 / Yucheng

变更记录见 [CHANGELOG.md](CHANGELOG.md)。
