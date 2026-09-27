# 旅界 Android · 颗粒度审计与修复计划

> 规则：先规划 → 并行子代理审计 → 修复 → 测试 → 再发版。不允许未测发版。

## 范围
工程根：`/Volumes/LANPO/mimo work/xiaoshuo/android-native/`
构建：`/tmp/lvjie-build`（JDK17 外置盘 / SDK35 / Gradle 8.9）

## 审计维度（每项必须有 PASS / FAIL + 证据）

### A. UI 层（每屏每按钮）
- [ ] A1 Welcome：6 世界可点、主题切换、继续/开始、自定义包列表、详情/API/帮助入口
- [ ] A2 Detail：三页签内容真切换；进入/新开一局
- [ ] A3 Author：四步向导、表单可编辑、生成进度、保存回调
- [ ] A4 Api：协议切换、三个字段、保存/测试/刷新、模型点选、密码掩码
- [ ] A5 Help：FAQ 可展开（若有交互）
- [ ] A6 Scene：地点卡、行动按钮、事件流式、选项、自由输入、结束事件、NPC 交谈
- [ ] A7 Map：当前位置、地点列表、移动、当前高亮
- [ ] A8 Profile：境界/进度/突破、数值、同伴、经历
- [ ] A9 Bag：任务/行囊分段、状态 Chip、使用物品
- [ ] A10 Settings：AI 风格、语言、对话限制、BGM、API 入口、导出/导入/删除
- [ ] A11 状态栏/手势条安全区（全屏）
- [ ] A12 Toast / 突破全屏 / 删除对话框 / 导入对话框

### B. 引擎层
- [ ] B1 GameViewModel 状态一致性（state/world/event/feedback）
- [ ] B2 事件流：本地模板 + LLM SSE + 回退
- [ ] B3 changes 落库：progress/money/item/friend/quest/events
- [ ] B4 突破：条件、数值、全屏文案、持久化
- [ ] B5 物品使用：count/移除/进度
- [ ] B6 talkWith 好感与新同伴
- [ ] B7 BGM 生命周期
- [ ] B8 persist 时机完整性

### C. 数据层
- [ ] C1 SaveRepository 读写/删除/导入导出
- [ ] C2 CustomPack 持久化与恢复
- [ ] C3 Credentials + KeyVault 加密往返
- [ ] C4 序列化兼容（缺字段不崩）
- [ ] C5 启动读档正确性

### D. 交互/健壮性
- [ ] D1 空状态（无同伴/无任务/无物品/无存档）
- [ ] D2 重复点击防抖（事件进行中）
- [ ] D3 长文本/长名称截断
- [ ] D4 配置错误（空 Key、坏 URL）可读报错
- [ ] D5 旋转/进程重建（若可静态评估）
- [ ] D6 资源：图标、BGM asset、无泄漏大文件

## 测试计划（发版门槛）
1. `gradle assembleDebug assembleRelease` 0 error
2. Kotlin 警告清零（或评估为无害）
3. `aapt2 dump badging` + `apksigner verify`
4. 关键逻辑单测脚本（Node/Python 模拟或 JVM test）
5. 清单：每个 FAIL 修复后有 PASS 证据
6. 只有全部绿才打 tag 发版

## 子代理分工（并行）
1. **ui-audit**：A 全部，输出问题清单 file:line + 建议
2. **engine-audit**：B + C5，逻辑缺陷与并发问题
3. **data-audit**：C 全部 + D6 资源
4. **flow-audit**：D 全部 + 接线完整性（按钮→VM→结果）

## 修复规则
- 一次修一类问题，修完立即编译
- 不引入新 API/新依赖 unless 必要
- 不删功能，只补全/纠正
- 测试报告写入 `android-native/TEST-REPORT.md`
