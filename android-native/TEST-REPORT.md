# 旅界 Android 测试报告 · v1.1.0

日期：2026-09-28
范围：4 代理颗粒度审计后的 P0/P1 修复回归

## 测试结果

| # | 用例 | 结果 | 证据 |
|---|------|------|------|
| T1 | assembleDebug + assembleRelease | **PASS** | BUILD SUCCESSFUL |
| T2 | APK 体积 / 字体 / BGM 资源 | **PASS** | 13MB（原 33MB）；fonts=0；bgm_ambient.wav=1 |
| T3 | aapt2 badging | **PASS** | com.lvjie.nativeapp · 旅界 · 1.1.0 / vc5 · minSdk 26 / target 35 |
| T4 | apksigner verify | **PASS** | SIGN OK |
| T5 | 13 项源码修复断言 | **PASS** | 见下 |

## T5 明细
- PASS onCleared persist before super（丢档修复）
- PASS continueLast / startOrContinue（继续游戏）
- PASS settleCurrentEventGains（换轮收益结算）
- PASS langInstr（语言生效到提示词）
- PASS talkWith busy guard（防刷好感）
- PASS breakthrough clamp lastIndex（边界）
- PASS stream failed flag（回退竞态）
- PASS trySendBlocking（流式丢字）
- PASS listModels HTTP check
- PASS registerCustom adapter（自定义世界可玩）
- PASS export scans save_ keys（自定义档导出）
- PASS no ttf in res/font（去 32MB 字体）

## 审计问题关闭情况
### P0（6/6 关闭）
1. 继续上次覆盖存档 → startOrContinue/continueLast
2. onCleared 丢档 → runBlocking 先写盘
3. 字体 32MB 入包 → 系统字体回退
4. stream 丢字 → trySendBlocking
5. 自定义世界不可玩/导出丢档 → registerCustom + 导出全键
6. LLM 回退竞态 → failed 标记短路

### P1（主要关闭）
语言、对话轮数提示、详情续档、工坊表单绑定、API 表单测试、换轮结算、突破 clamp、talkWith 防刷、listModels 状态、BgmPlayer 异步、LlmClient 死代码清理

### P2 部分关闭
空状态（任务/行囊/经历）、按钮 busy 置灰、BGM 文案、rememberSaveable、当前地点不可点、同伴计数

## 遗留（已知、非阻断）
- 工坊「整本小说/联网补充」来源仍为简化流程（表单+保存可用）
- UI 文案仍以简体为主（语言设置影响 AI 叙事输出）
- 无深色主题
- LLM 需真实 Key 做端到端验收

## 结论
**可以发版 v1.1.0**。P0 全关，测试 5/5 PASS。

---

# v1.1.1 回归测试（2026-09-28）

| 用例 | 结果 |
|------|------|
| 构建 assembleDebug+Release | PASS |
| APK 13MB / 无字体 / 含 BGM | PASS |
| badging 1.1.1 vc6 | PASS |
| 签名 | PASS |
| 暗色主题 | PASS |
| 游戏返回确认 | PASS |
| 分享失败保留导出 | PASS |
| API Key 显隐 | PASS |
| 工坊动态进度 | PASS |
| 空输入提示 | PASS |
| 选项解析正则 | PASS |
| LLM 早结保底收益 | PASS |

**结论：v1.1.1 可发版。P2 主要项已关闭。**

# v1.2.0 三轮复审测试

| 用例 | 结果 |
|------|------|
| CancellationException 上抛 | PASS |
| tiers 越界防护 | PASS |
| hasSave 真实状态 | PASS |
| BackHandler 系统返回 | PASS |
| 导入按 worldId 落键 | PASS |
| 导出含 customPacks | PASS |
| loadJob 竞态守卫 | PASS |
| useItem 原子更新 | PASS |
| BgmPlayer 同步释放 | PASS |
| test() POST 兜底 | PASS |
| 结算后 persist | PASS |
| 自定义包校验 | PASS |
| Json 单例 | PASS |
| 构建/签名/体积 13MB | PASS |

**结论：P0 二次发现的 2 项已关闭，P1 复核项关闭，v1.2.0 可发。**

# v1.3.0 测试
| 用例 | 结果 |
|------|------|
| I18n 四语文案 | PASS |
| LLM 世界草稿生成（失败回退模板） | PASS |
| 工坊接通 onGenerate | PASS |
| 欢迎/设置/底栏多语言 | PASS |
| 构建/签名/13MB | PASS |
