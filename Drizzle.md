# Drizzle 开发者文档

写给想参与进来或者想自己改改用的朋友。

## 项目是干嘛的

一个实时翻译工具，主要场景是游戏里和老外打字、语音沟通。接了有道的翻译接口，界面是玻璃拟态风格，用 Vue 3 + Electron 写的。

## 环境准备

### 需要什么

- Node.js >= 18
- npm >= 9

### 装依赖

```bash
npm install
```

### 配一个有道 API

这个是必填的，不然翻译用不了。自己到[有道智云](https://ai.youdao.com/)申请，免费的翻译额度够个人用。

1. 申请完之后，在项目根目录新建一个文件叫 `.env.local`
2. 写入这两行：

```env
VITE_YOUDAO_APP_KEY=你的AppKey
VITE_YOUDAO_APP_SECRET=你的AppSecret
```

不用担心传上去泄露，`.gitignore` 已经把这个文件排除了。

## 常用命令

```bash
npm run dev          # 起开发服务，跑 http://localhost:3000
npm run build        # 打包前端
npm run build:electron # 打包成桌面应用
npm run preview      # 看打包出来的效果
npm run clean        # 删 dist、dist-electron 这些构建产物
npm run lint         # 检查代码规范
npm run lint:fix     # 自动修规范问题
npm run format       # prettier 格式化
npm run typecheck    # TS 类型检查
npm run test         # 跑测试
npm run test:run     # CI 模式跑一次测试
```

## 目录结构

```
src/
├── components/       # 组件，按功能分目录
│   ├── common/      # 通用组件
│   ├── translation/  # 翻译页面的组件
│   └── voice/        # 语音翻译页面的组件
├── views/           # 页面，对应路由
├── stores/          # Pinia 状态管理
├── router/          # 路由
└── @                 # 路径别名，指向 src/

electron/
├── core/            # 主进程入口，窗口创建在这里
├── handlers/        # IPC 处理器，一个文件管一个功能
├── services/        # 业务逻辑，API 调用放这里
└── preload.ts       # 暴露 IPC 接口给渲染进程用
```

## 主进程和渲染进程怎么通信的

渲染进程调用 `window.ipcRenderer.XXX()` → preload 转发 → main 进程处理 → 返回结果。

窗口控制接口：

- `window.ipcRenderer.windowMinimize()` — 最小化
- `window.ipcRenderer.windowMaximize()` — 最大化 / 还原
- `window.ipcRenderer.windowClose()` — 关闭
- `window.ipcRenderer.windowIsMaximized()` — 查询当前状态

## 环境变量在哪加载的

`electron/services/env.ts`。打包后 `.env.local` 会自动复制到输出目录，不用手动处理。

API 密钥不要写进代码里，统一走 `.env.local`。

## 命名规范

| 类型 | 怎么写 | 例子 |
|------|--------|------|
| Vue 组件 | PascalCase.vue | `LangSelector.vue` |
| Composables | use + PascalCase.ts | `useTranslation.ts` |
| 目录和文件 | kebab-case | `components/common/` |
| 变量 | camelCase，布尔值用 is/has/can 开头 | `isLoading` |

## 代码组织

- **逻辑是 IPC 相关的** → `electron/handlers/` 加 handler，`electron/services/` 写业务
- **是新 UI 功能** → `src/views/` 里建页面，组件放页面同目录
- **跨组件共享状态** → 考虑用 Pinia，放 `src/stores/`
- **一个文件超过 300 行** → 拆开，别堆在一起
- **类型在多个文件里重复定义** → 提取到 `src/types/` 或 `electron/services/types.ts`

## 雷区

- `electron/core/` 只放 Electron 基础设施，业务逻辑别往这里塞
- API 密钥不能硬编码
- 引入新库之前看一下包体积大不大
- 渲染进程和主进程的边界要清晰，不要在渲染进程里直接调 Electron API

## 测试怎么写

用 Vitest + happy-dom，测试文件和源码放同目录，后缀 `.spec.ts`。比如 `settingsStore.spec.ts` 和 `settingsStore.ts` 在一起。跑 `npm run test` 监听模式，`npm run test:run` 单次执行。
