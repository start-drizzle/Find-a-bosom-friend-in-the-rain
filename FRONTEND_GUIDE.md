# 前端目录规范

## 目录结构

```
src/
├── components/          # 共享组件 (目前缺失，按需建立)
│   ├── common/          # 基础组件 (Button、Input 等)
│   └── [feature]/       # 业务组件 (translation/ 等)
├── composables/          # 组合式函数 (目前缺失)
├── router/              # 路由配置 (目前内联于 main.ts)
├── stores/              # Pinia 状态管理 (目前缺失)
├── types/               # TypeScript 类型 (目前缺失)
├── utils/               # 工具函数 (目前缺失)
├── views/               # 页面组件 (已有)
├── App.vue
├── main.ts
└── index.css
```

## 核心原则

**不要提前创建目录** — 当某个模式出现第二次时再提取。

| 触发时机 | 创建目录 |
|---------|---------|
| 多个视图共用组件 | `components/common/` |
| 视图逻辑超 200 行 | `composables/` |
| 类型在多处重复定义 | `types/` |
| 路由需守卫或 meta | `router/index.ts` |
| 跨组件状态超 2 处 | `stores/` |
| 相似工具函数超 3 个 | `utils/` |

## 组件组织

- **通用组件** — 无业务依赖，放 `components/common/`
- **业务组件** — 依赖特定状态，放 `components/[feature]/`
- **页面组件** — 路由页面，放 `views/`

超过 300 行或超过 5 个 v-model 时拆分。

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase + .vue | `LangSelector.vue` |
| Composables | use + PascalCase + .ts | `useTranslation.ts` |
| 目录/文件 | kebab-case | `components/common/` |
| 变量 | camelCase，布尔用 is/has/can 前缀 | `isLoading` |

## IPC 架构 (当前良好)

```
preload.ts  →  暴露最小 API
handlers/   →  IPC 入口，调用 services
services/   →  业务逻辑，纯函数
```

不要在 `electron/core/` 写业务逻辑。

## 路由配置

迁移时机：需要路由守卫或懒加载时，从 `main.ts` 提取到 `router/index.ts`，使用动态导入：

```typescript
{ path: '/realtime', component: () => import('@/views/RealtimeTranslation.vue') }
```

## 样式

- 全局变量：`src/index.css` 的 `@theme`
- 组件样式：`<style scoped>`
- 不使用 scoped 时添加明确的前缀/命名空间
