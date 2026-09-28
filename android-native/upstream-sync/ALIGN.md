# 与上游 Fly143/LvJie-WanJie 对齐记录

- 上游版本：v0.0.7.1（2026-09-28）
- 本仓基线原为 v0.0.3；**原生安卓版**已对齐以下能力：

## 已对齐
| 上游特性 | 原生实现 |
|----------|----------|
| 货币四档（下/中/上/极品） | PlayerState money/moneyMid/moneyHigh/moneyPeak |
| 货币按题材命名 | 修仙灵晶/灵石、武侠金银铜、职场元、末世物资、西幻铜银金 |
| 极品持有才显示 | UI 仅在 peak>0 时展示 |
| 选项去重复序号 | LLM 选项二次 strip 前缀序号 |
| BGM 全局偏好 | GlobalPrefs.bgm |
| 多 Key 分协议 | LlmConfig.protocol |

## 部分对齐（Web 独有/后续）
- 婚姻剧情（末世）— 未进原生
- 付款 1:100 找零 — 原生当前为简单累加
- MIDI 播放 — 原生用 WAV 环境音
- 自定义世界生成断点续接 — 原生为本地/LLM 草稿

## 策略
- 不向原仓库推 PR；独立演进
- 重大玩法变更以本表登记，便于持续对齐

## v1.5.1 追加对齐
- 货币高抵低找零 Money.spend
- 婚姻：好感≥60 同场景求婚，成功为伴侣
- FileProvider 文件分享存档 JSON
- release minify + shrinkResources
