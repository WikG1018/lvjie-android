# 审计问题总表（4 代理合并）与修复计划

## P0 必须修（阻断/丢档/假功能）
| ID | 问题 | 位置 | 修复 |
|----|------|------|------|
| P0-1 | 「继续上次」实为覆盖存档重开 | Welcome/MainActivity/VM | continueGame() 读档 |
| P0-2 | onCleared 在 super 后 persist 丢档 | GameViewModel | persist 先于 super |
| P0-3 | 4×8MB 字体入包 32MB | Type.kt + res/font | 系统字体回退，删字体资源 |
| P0-4 | stream trySend 丢字 | LlmService | trySendBlocking |
| P0-5 | 自定义世界不可玩/导出丢档 | Models/SaveRepo/Welcome | CustomPack→WorldPack + 导出全量 |
| P0-6 | LLM 失败回退竞态 | GameViewModel | catch 后 return@launch |

## P1 重要
| ID | 问题 | 修复 |
|----|------|------|
| P1-1 | 语言设置无效 | prompt 接入 lang |
| P1-2 | 对话轮数限制假开关 | 达阈值强制收束 |
| P1-3 | 详情「进入世界」=新开 | 拆 continue/new |
| P1-4 | 工坊摘要假输入/保存硬编码 | 绑定 waTag + 表单数据 |
| P1-5 | API 测试用旧配置 | 表单参数传入 |
| P1-6 | 选项换轮丢收益 | 换轮先结算 |
| P1-7 | breakthrough 越界 | clamp tiers.lastIndex |
| P1-8 | delete 后恢复串档 | 删除后写 fallback/清 active |
| P1-9 | init 恢复与新开竞态 | loaded 标记 |
| P1-10 | talkWith 可刷好感 | busy guard |
| P1-11 | listModels 无 HTTP 检查 | isSuccessful |
| P1-12 | LlmClient 死代码 | 迁 LlmConfig 后删类 |
| P1-13 | BgmPlayer 主线程 prepare/泄漏 | 异步+释放 |
| P1-14 | export 漏自定义 | 遍历 save_ 键 |

## P2 体验（尽量修）
空态、按钮置灰、保存 Toast、分享失败、rememberSaveable、BGM 文案、Key 显隐、光标行内、当前地点不可点等。

## 测试门槛
1. assembleDebug+Release 0 error
2. 字体不再入包（APK ≤ 8MB 量级）
3. aapt badging + apksigner
4. 逻辑冒烟脚本：continue/导出/突破边界/序列化
5. TEST-REPORT.md 记录每项 PASS
