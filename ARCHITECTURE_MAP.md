# Drizzle Translator 项目全景图

> 每个框是一个文件，箭头表示"调用/依赖"关系
> `(函数名)` 表示这个文件里做了什么事

---

## 一、应用启动流程

```
用户双击打开应用
    │
    ▼
electron/main.ts ── 启动入口
    │
    ├─→ electron/services/env.ts
    │     └─ loadEnvVars()
    │        读取 .env.local → 导出 API 密钥常量
    │        (YOUDAO_APP_KEY, DASHSCOPE_API_KEY, REMOTE_API_KEY...)
    │
    ├─→ electron/core/window.ts
    │     └─ createWindow()
    │        创建 1280×800 无边框窗口
    │        加载前端页面 (开发模式用 localhost:3000, 打包模式用 dist/index.html)
    │
    ├─→ electron/core/ipc.ts
    │     └─ registerIpcHandlers()
    │        注册所有 IPC 通信处理器 (见下面的 IPC 注册表)
    │
    └─→ electron/handlers/hotkeyPipeline.ts
          └─ registerTranslationCompleteListener()
             监听 "translation:complete" 事件
```

---

## 二、前端页面结构

```
src/main.ts ── 前端入口 (只有 8 行)
    │
    ├─ 安装 Pinia (状态管理)
    ├─ 安装 Router (路由)
    └─ 挂载 App.vue
          │
          ▼
src/App.vue
    │
    ├─→ src/components/common/TopAppBar.vue      顶部栏 (最小化/最大化/关闭)
    ├─→ src/components/common/SideNavBar.vue      侧边导航栏
    │     └─ 从 src/router/index.ts 自动读取 navItems
    │        (添加新路由 → 侧边栏自动出现，不用手动改)
    │
    └─→ <router-view>  根据当前路由显示对应页面
          │
          ├─ /realtime  → src/views/RealtimeTranslation.vue
          ├─ /voice     → src/views/VoiceTranslation.vue
          ├─ /models    → src/views/ModelSelection.vue (占位页)
          ├─ /zuan      → src/views/ZuanStyle.vue (占位页)
          ├─ /dictionary→ src/views/ZuanDictionary.vue (占位页)
          └─ /debug-window → src/views/DebugWindow.vue (独立窗口，没有顶栏和侧栏)
```

---

## 三、路由系统

```
src/router/index.ts ── 所有路由定义 + 导航数据
    │
    ├─ 定义路由 (每个路由带 meta 信息)
    │   /realtime      { label: '实时翻译', icon: 'translate', showInNav: true }
    │   /voice         { label: '语音翻译', icon: 'mic', showInNav: true }
    │   /models        { label: '模型选择', icon: 'psychology', showInNav: true }
    │   /zuan          { label: '喷子风格', icon: 'whatshot', showInNav: true }
    │   /dictionary    { label: '喷子词典', icon: 'menu_book', showInNav: true }
    │   /debug-window  { showInNav: false }  ← 不在导航栏显示
    │
    ├─ 自动生成 navItems (过滤 showInNav: true 的路由)
    │   → SideNavBar 直接用这个数组，不用手动维护
    │
    └─ setRecordingGuard(flag)
        录音时防止切页 → 弹确认框
        被 useRecording.ts 调用
```

---

## 四、状态管理 (Pinia Store)

```
src/stores/translationStore.ts ── 全局翻译状态
    │
    │  存的东西:
    │  ├─ inputText        用户输入的原文
    │  ├─ translatedText   翻译出来的结果
    │  ├─ translating      正在翻译中?
    │  ├─ selectedLang     目标语言 (English/中文/日本語...)
    │  ├─ selectedModel    翻译模型 (llm/nmt)
    │  ├─ languages        语言列表
    │  ├─ modelOptions     模型选项列表
    │  └─ pingLatencyMs    延迟毫秒数
    │
    │  谁在用:
    ├─→ RealtimeTranslation.vue (显示/绑定)
    └─→ useTranslation.ts (读取+修改)
```

---

## 五、翻译功能流程 (完整调用链)

```
用户在输入框打字 → 点击翻译按钮
    │
    ▼
src/views/RealtimeTranslation.vue
    │  只管界面布局，把事情交给 composable
    │
    ├─→ useTranslation() ← src/composables/useTranslation.ts
    │     │
    │     ├─ handleTranslate()
    │     │   1. 从 translationStore 拿 inputText, selectedLang, selectedModel
    │     │   2. 检查: 空的? 正在翻译中? → 不执行
    │     │   3. 调用 window.ipcRenderer.translate(text, from, to, model)
    │     │      │
    │     │      ▼  ── Electron IPC 边界 ──
    │     │      │
    │     │      electron/preload.ts
    │     │        └─ contextBridge 暴露的 translate() 方法
    │     │           用 ipcRenderer.invoke("translate", ...) 转发到主进程
    │     │
    │     │      electron/handlers/translate.ts
    │     │        └─ ipcMain.handle("translate", ...)
    │     │           检查输入 → 调用 translation service
    │     │           │
    │     │           ▼
    │     │      electron/services/translation.ts
    │     │        ├─ translate({ text, to, model })
    │     │        │   model === "nmt" → translateNMT()
    │     │        │   model === "llm" → translateLLM()  (默认)
    │     │        │
    │     │        ├─ translateNMT() → POST https://openapi.youdao.com/api
    │     │        │   普通翻译，一次返回结果
    │     │        │
    │     │        └─ translateLLM() → POST https://openapi.youdao.com/proxy/http/llm-trans
    │     │            流式翻译，读取 SSE 事件流
    │     │
    │     │      结果原路返回: service → handler → preload → 渲染进程
    │     │      │
    │     │      ▼  ── Electron IPC 边界 (回来) ──
    │     │
    │     │   4. 拿到 { translation: "Hello" } 或 { error: "失败原因" }
    │     │   5. 写入 translationStore.translatedText
    │     │   6. 页面自动更新显示翻译结果
    │     │
    │     └─ copyTranslation()
    │         把翻译结果复制到剪贴板 (navigator.clipboard.writeText)
    │
    └─→ useCapturePipeline() ← src/composables/useCapturePipeline.ts
          截图→检测→OCR→翻译 的完整管线 (见第七节)
```

---

## 六、语音翻译流程

```
用户点击麦克风按钮开始录音
    │
    ▼
src/views/VoiceTranslation.vue
    │
    ├─→ useRecording() ← src/composables/useRecording.ts
    │     │  录音总管
    │     │
    │     ├─ setupMicrophone()
    │     │   获取麦克风权限 → 创建 AudioContext → 开始采集音频
    │     │
    │     ├─ startRecording()
    │     │   1. 调 setupMicrophone()
    │     │   2. 调 window.ipcRenderer.asrStart(sourceLanguage)
    │     │      │
    │     │      ▼  ── Electron IPC ──
    │     │      electron/handlers/asrHandler.ts
    │     │        └─ ipcMain.handle("asr:start", ...)
    │     │           调用 ASRService.startRecognition()
    │     │           │
    │     │           ▼
    │     │      electron/services/asrService.ts
    │     │        └─ ASRService (继承 EventEmitter)
    │     │           ├─ 连接 Aliyun DashScope WebSocket
    │     │           ├─ 发送 run-task 消息
    │     │           └─ 开始接收音频流
    │     │
    │     ├─ 持续发送音频数据
    │     │   每秒采集 → window.ipcRenderer.asrSendAudio(buffer)
    │     │      → asrHandler → asrService.ws.send(buffer)
    │     │
    │     ├─ 接收识别结果 (主进程 → 渲染进程)
    │     │   asrService 触发 "transcription" 事件
    │     │      → asrHandler 转发 → webContents.send("asr:transcription", data)
    │     │      → preload 传递 → 渲染进程监听回调
    │     │
    │     └─ stopRecording()
    │         调 window.ipcRenderer.asrStop()
    │            → asrService.stopRecognition()
    │               发送 finish-task → 关闭 WebSocket
    │
    ├─→ useChatBubbles() ← src/composables/useChatBubbles.ts
    │     │  管理聊天气泡列表
    │     │
    │     ├─ updateCurrentSrc(text)  实时更新当前气泡 (ASR还在识别中)
    │     ├─ handleEnter()          一句话说完了 → 生成翻译气泡
    │     ├─ endBubble()            延迟3秒后把"进行中"气泡标记为完成
    │     └─ resetAll()             清空所有气泡
    │
    └─→ useAudioCanvas() ← src/composables/useAudioCanvas.ts
          │  音频可视化数据
          │
          ├─ computeMetrics(freqData, waveData, barCount)
          │   计算 freqVolume (音量) 和 waveAmplitude (波形幅度)
          │   判断 isSoundDetected (是否检测到声音)
          └─ resetMetrics()  重置所有数据
```

---

## 七、快捷键管线 (Ctrl+P 截图翻译)

```
用户在游戏中按 Ctrl+P
    │
    ▼
electron/main.ts
    └─ uIOhook 键盘钩子捕获 (系统级，游戏全屏也能响应)
       │
       ▼
electron/handlers/hotkeyPipeline.ts
    └─ handleCtrlP()
       │
       │  第1步: 截图裁剪
       ├─→ electron/services/screenshot.ts
       │     └─ captureAndCrop()
       │        用 Electron desktopCapturer 截屏
       │        按之前保存的 YOLO 坐标裁剪出聊天区域
       │
       │  第2步: OCR 识别 (并行处理所有区域)
       ├─→ electron/services/ocrService.ts
       │     └─ recognizeText(imageBuffer)
       │        POST → https://startdrizzling.cn/api/ocr
       │        (ConvNextViT 模型识别文字)
       │
       │  第3步: 把识别结果发给前端显示 + 触发翻译
       │  webContents.send("ocr:result", { text: "..." })
       │  webContents.send("trigger:translate", { text: "..." })
       │      │
       │      ▼  ── Electron IPC (到渲染进程) ──
       │
       │  src/composables/useCapturePipeline.ts
       │     ├─ 监听 "ocr:result" → 更新页面显示原文
       │     └─ 监听 "trigger:translate" → 调用 handleTranslate()
       │        (走第五节的翻译流程)
       │
       │  第4步: 翻译完成后通知主进程
       │  window.ipcRenderer.notifyTranslationComplete(translatedText)
       │      │
       │      ▼  ── Electron IPC (回主进程) ──
       │
       │  hotkeyPipeline.ts 监听 "translation:complete"
       │
       │  第5步: 模拟键盘输入
       └─→ electron/services/keyboardSim.ts
             └─ simulateKeyboardOutput(text)
                启动 keyboard_input.exe
                (Python 打包的 EXE)
                模拟 Ctrl+A → Backspace → 逐字输入翻译结果
```

### Ctrl+L 区域定位流程

```
用户按 Ctrl+L
    │
    ▼
electron/main.ts
    └─ webContents.send("trigger-capture")
           │
           ▼  ── Electron IPC (到渲染进程) ──
       useCapturePipeline.ts
           │
           ├─ window.ipcRenderer.captureScreen()
           │   → screenshot.ts → 截图返回 base64
           │
           ├─ window.ipcRenderer.yoloDetect(imageData, w, h)
           │   → yoloDetection.ts → POST https://startdrizzling.cn/api/detect
           │   → 返回检测框坐标 (聊天框位置)
           │
           └─ window.ipcRenderer.storeYoloCoords(detections)
               → screenshot.ts → storeDetections()
               → 保存坐标，Ctrl+P 时用来裁剪
```

---

## 八、窗口管理

```
TopAppBar.vue (最小化/最大化/关闭按钮)
    │
    ├─ window.ipcRenderer.windowMinimize()
    │   → electron/handlers/window.ts → getWin().minimize()
    │
    ├─ window.ipcRenderer.windowMaximize()
    │   → electron/handlers/window.ts → getWin().maximize() / unmaximize()
    │
    └─ window.ipcRenderer.windowClose()
        → electron/handlers/window.ts → getWin().close()

主进程 → 渲染进程 窗口状态同步:
    window.ts → webContents.send("window-state-changed", isMaximized)
    → TopAppBar 监听 → 更新图标显示
```

---

## 九、IPC 通信总表

```
渲染进程                              主进程
──────────────────────────────────────────────────────────
window.ipcRenderer.translate()    → handlers/translate.ts    → services/translation.ts
window.ipcRenderer.captureScreen() → handlers/screenshot.ts  → services/screenshot.ts
window.ipcRenderer.yoloDetect()   → handlers/yoloDetection.ts → services/yoloDetection.ts
window.ipcRenderer.storeYoloCoords()→ handlers/screenshot.ts → services/screenshot.ts
window.ipcRenderer.getScreenResolution()→ handlers/screenshot.ts
window.ipcRenderer.asrStart()     → handlers/asrHandler.ts   → services/asrService.ts
window.ipcRenderer.asrStop()      → handlers/asrHandler.ts   → services/asrService.ts
window.ipcRenderer.asrSendAudio() → handlers/asrHandler.ts   → services/asrService.ts
window.ipcRenderer.windowMinimize() → handlers/window.ts
window.ipcRenderer.windowMaximize() → handlers/window.ts
window.ipcRenderer.windowClose()   → handlers/window.ts
window.ipcRenderer.notifyTranslationComplete() → handlers/hotkeyPipeline.ts → services/keyboardSim.ts
──────────────────────────────────────────────────────────
主进程 → 渲染进程 (webContents.send)
asr:transcription    ASR 识别结果
asr:status           ASR 状态变化
asr:error            ASR 错误
ocr:result           OCR 识别文字
trigger:translate    触发翻译
trigger-capture      Ctrl+L 触发截图
yolo:crop-result     裁剪结果(出错时)
window-state-changed 窗口最大化状态
```

---

## 十、共享类型 (单数据源)

```
src/types/index.ts ── 所有共享类型定义
    │
    ├─ Bubble           聊天气泡
    ├─ ModelOption      翻译模型选项
    ├─ YoloDetection    YOLO 检测结果
    ├─ OcrResultPayload OCR 结果
    ├─ TranslateResult  翻译结果
    ├─ MAIN_TO_RENDERER_CHANNELS  所有主→渲染通道名的常量数组
    └─ MainToRendererChannel      上述数组的类型 (自动推导)
    │
    │  谁在用:
    ├─→ src/vue-env.d.ts        渲染进程的 TypeScript 类型声明
    ├─→ electron/preload.ts     预加载脚本的通道白名单
    └─→ src/components/         各组件 import 类型
```

---

## 十一、Composable 功能一览

```
src/composables/
    │
    ├─ useTranslation.ts        翻译 + 复制功能
    │   └─ handleTranslate(), copyTranslation()
    │
    ├─ useCapturePipeline.ts    截图→检测→OCR→翻译 管线
    │   └─ handleCaptureClick(), checkYoudao(), IPC 监听
    │
    ├─ useRecording.ts          录音总管
    │   └─ startRecording(), stopRecording(), setupMicrophone()
    │
    ├─ useChatBubbles.ts        聊天气泡状态
    │   └─ updateCurrentSrc(), handleEnter(), endBubble(), resetAll()
    │
    ├─ useAudioCanvas.ts        音频可视化数据
    │   └─ computeMetrics(), resetMetrics()
    │
    ├─ useDropdown.ts           下拉菜单开关
    │   └─ open(), close(), toggle(), selectAndClose()
    │
    ├─ useConnectivityCheck.ts  有道 API 连通检测
    │   └─ checkYoudao(), startPolling(), stopPolling()
    │
    └─ useDebugWindow.ts        调试窗口生命周期
        └─ start(), stop(), sendAnalyser()
```

---

## 十二、日志系统

```
electron/services/logger.ts ── 主进程日志工具
    │
    │  日志文件位置: %APPDATA%/drizzle-translator/logs/YYYY-MM-DD.log
    │  日志格式: [HH:MM:SS] [INFO/WARN/ERROR] 内容
    │  自动删除 7 天前的旧日志
    │
    │  三个方法:
    ├─ logger.info(...)    正常流程记录
    ├─ logger.warn(...)    警告 (可能有问题但不致命)
    └─ logger.error(...)   错误 (出错了)
    │
    │  所有主进程文件都在用:
    ├─→ main.ts, core/window.ts
    ├─→ handlers/ (全部 6 个)
    └─→ services/ (全部 7 个)
```

---

## 十三、测试覆盖

```
测试文件                              测试了什么
──────────────────────────────────────────────────────────────
src/stores/translationStore.spec.ts   状态读写、计算属性、一致性
src/composables/useTranslation.spec.ts 翻译调用、空输入保护、错误处理、复制
src/composables/useChatBubbles.spec.ts 气泡创建、结束、定时器、重置
src/composables/useDropdown.spec.ts    打开/关闭/延时/取消定时器
src/composables/useAudioCanvas.spec.ts 音量计算、声音检测、重置
src/router/index.spec.ts              导航项过滤、meta 字段、排除项
──────────────────────────────────────────────────────────────
运行: npm run test:run → 50 个测试全跑一遍，几秒出结果
```

---

## 十四、构建产物

```
npm run build
    │
    ├─ dist/              前端打包产物
    │   ├─ index.html
    │   └─ assets/        JS + CSS (按路由拆分，按需加载)
    │
    ├─ dist-electron/     主进程打包产物
    │   ├─ main.js        Electron 入口
    │   └─ preload.mjs    预加载脚本
    │
    └─ release/           打包成安装包 (npm run build:electron)
```
