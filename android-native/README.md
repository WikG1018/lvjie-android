# 旅界 · 安卓原生版（Compose）

按设计规划实现的 **Kotlin + Jetpack Compose + Material 3** 原生客户端。

## 构建

```bash
# 需 JDK 17 + Android SDK 35
./gradlew assembleDebug assembleRelease
# 产物：app/build/outputs/apk/{debug,release}/
```

## 已实现

- **设计系统**：HyperOS 色板 / 28-22-16 形状 / **MiSans**（res/font/misans_*.ttf）
- **六世界皮肤**：修仙/玄幻/武侠/职场/末世/西幻，M3 动态主题
- **屏幕**：欢迎、详情、工坊、API、帮助、场景、地图、人物、囊务、设置
- **玩法**：事件流式叙事（本地模板 + LLM SSE）、选项、自由输入、数值落库、突破全屏、物品
- **数据**：DataStore 存档 + 导入导出（不含 Key）
- **安全**：Android Keystore AES-256-GCM 加密 API Key
- **LLM**：chat / response 协议，SSE 流式，模型列表拉取

## 签名

release 使用 `release.keystore`（本地生成，不入库）。上架请更换正式签名。

## MiSans

官方字体来自小米 hyperos.mi.com，放入 `app/src/main/res/font/misans_{regular,medium,semibold,bold}.ttf`。
因体积较大未入库，构建前请自行放置。
