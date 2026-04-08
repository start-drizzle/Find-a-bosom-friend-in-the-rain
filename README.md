<div align="center">
  <h1>
    <img src="https://img.shields.io/badge/Drizzle-Translator-1d8870?style=for-the-badge&labelColor=0f172a" alt="Drizzle Translator">
  </h1>
  <p>游戏实时翻译桌面应用 — 文本翻译 · 语音识别 · 文字转语音</p>
</div>

---

## 它解决什么问题

你是否曾因为语言不通，在游戏里和外国玩家 "鸡同鸭讲"？

深夜天梯碰上国际纵队，战术配合只能靠打字比划？被队友问"Are you ready"，脑子一片空白只憋出一句"Yeah"？本地化不完整的游戏要么硬啃生肉，要么眼巴巴看着隔壁服玩家聊得火热，自己一个字都插不进去。

**Drizzle** 正是为这些问题而生。文本实时翻译、语音转文字、文字转语音——你要的这些，它都有。

---

## 功能特性

| 功能 | 说明 |
|------|------|
| 实时文本翻译 | 输入即翻译，支持多语言 |
| 语音识别翻译 | 录音实时转文字并翻译，语音对话无障碍 |
| 文字转语音 | 翻译结果可直接朗读，支持选择音色 |
| 游戏录制视角 | 录制游戏画面，配合翻译一起使用 |

---

## 技术栈

**前端框架：** Vue 3 + Vite + TypeScript
**桌面应用：** Electron
**样式：** Tailwind CSS v4（玻璃拟态 UI）
**翻译服务：** 有道 NMT / LLM API
**状态管理：** Pinia

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env.local`，填入你的有道 API 密钥：

```bash
cp .env.example .env.local
```

```env
VITE_YOUDAO_APP_KEY=你的AppKey
VITE_YOUDAO_APP_SECRET=你的AppSecret
```

### 开发模式

```bash
npm run dev
```

应用会在 `http://localhost:3000` 启动。

### 构建桌面应用

```bash
npm run build:electron
```

构建完成后安装包位于 `release/` 目录。

---

## 项目结构

```
f:/zip1/
├── src/
│   ├── components/       # UI 组件
│   │   ├── common/        # 通用组件（加载器等）
│   │   ├── translation/  # 翻译功能相关组件
│   │   └── voice/         # 语音翻译相关组件
│   ├── views/             # 页面视图
│   ├── stores/            # Pinia 状态管理
│   └── router/            # 路由配置
├── electron/
│   ├── core/              # Electron 主进程核心（窗口、IPC）
│   ├── handlers/          # IPC 处理器
│   ├── services/          # 业务逻辑和外部 API
│   └── preload.ts         # 预加载脚本
├── Drizzle.md             # 开发者文档
├── FRONTEND_GUIDE.md      # 前端开发指南
└── package.json
```

---

## 相关文档

- [开发者文档](Drizzle.md) — 架构设计、IPC 通信规范、代码组织原则
- [前端开发指南](FRONTEND_GUIDE.md) — Vue 3 + Tailwind CSS v4 开发规范

---

## License

[MIT License](LICENSE)
