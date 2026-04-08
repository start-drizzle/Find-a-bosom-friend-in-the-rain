import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from 'vue-router'

/**
 * Route meta fields:
 * - label:     Display name in sidebar navigation
 * - icon:      Material Symbols icon name
 * - showInNav: Whether this route appears in the sidebar (false for utility pages)
 */
declare module 'vue-router' {
  interface RouteMeta {
    label?: string
    icon?: string
    showInNav?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/realtime',
  },
  {
    path: '/realtime',
    name: 'realtime',
    component: () => import('../views/RealtimeTranslation.vue'),
    meta: { label: '实时翻译', icon: 'translate', showInNav: true },
  },
  {
    path: '/models',
    name: 'models',
    component: () => import('../views/ModelSelection.vue'),
    meta: { label: '模型解析', icon: 'model_training', showInNav: true },
  },
  {
    path: '/zuan',
    name: 'zuan',
    component: () => import('../views/ZuanStyle.vue'),
    meta: { label: '祖安剑来', icon: 'bolt', showInNav: true },
  },
  {
    path: '/dictionary',
    name: 'dictionary',
    component: () => import('../views/ZuanDictionary.vue'),
    meta: { label: '祖安词库', icon: 'library_books', showInNav: true },
  },
  {
    path: '/voice',
    name: 'voice',
    component: () => import('../views/VoiceTranslation.vue'),
    meta: { label: '语音翻译', icon: 'mic', showInNav: true },
  },
  {
    path: '/debug-window',
    name: 'debug-window',
    component: () => import('../views/DebugWindow.vue'),
    meta: { showInNav: false },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// --- Navigation guard for recording state ---
let isRecordingGuard = false

export function setRecordingGuard(value: boolean) {
  isRecordingGuard = value
}

router.beforeEach((to) => {
  if (to.path === '/debug-window') return true

  if (isRecordingGuard && to.path !== '/voice') {
    const confirmed = window.confirm(
      '正在录音中，请先结束录音再切换页面。\n\nStill recording. Stop recording before leaving?',
    )
    if (confirmed) {
      isRecordingGuard = false
      return true
    }
    return false
  }
  return true
})

export default router

/** Navigation items derived from route meta — single source of truth */
export const navItems = routes
  .filter((r) => r.meta?.showInNav)
  .map((r) => ({
    path: r.path,
    label: r.meta!.label!,
    icon: r.meta!.icon!,
  }))
