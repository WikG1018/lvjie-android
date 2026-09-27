# 旅界 Android（复用桌面端游戏代码）

本目录是 **WebView 壳**，加载与 Windows 端同一套 `app/` 引擎（ESM）。

## 结构

- `app/src/main/assets/www/` ← 由 `node scripts/sync-android.js` 从仓库根 `app/` + `assets/` 同步
- `MainActivity.kt` 使用 `WebViewAssetLoader`，路径为 `https://appassets.androidplatform.net/assets/www/index.html`

## 构建（Android Studio / SDK）

```bash
node scripts/sync-android.js
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

需要 JDK 17 + Android SDK 34。

## 与桌面端差异

- 无 Electron `awHost`：LLM 直接 `fetch` API（已兼容）
- 存档 localStorage（WebView 持久化）
- 无系统 MIDI 代理时，MIDI 可能降级；可用 mp3 / 自定义本地音频
