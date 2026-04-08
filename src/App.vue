<template>
  <!-- Debug window: render only the component, no shell -->
  <div v-if="isDebugWindow" class="h-screen">
    <router-view />
  </div>

  <!-- Main app shell -->
  <div
    v-else
    class="bg-surface text-on-surface flex h-screen overflow-hidden font-sans"
  >
    <!-- SideNavBar -->
    <SideNavBar />

    <!-- Elegant Divider -->
    <div class="relative flex flex-col justify-center">
      <!-- Left edge glow -->
      <div
        class="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300/60 to-transparent"
      ></div>
      <!-- Center shimmer line -->
      <div
        class="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
      ></div>
      <!-- Center decorative element -->
      <div
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div class="w-1 h-1 rounded-full bg-primary/50 animate-pulse"></div>
        <div
          class="w-px h-8 bg-gradient-to-b from-primary/30 to-transparent"
        ></div>
        <div class="w-1 h-1 rounded-full bg-slate-300/50"></div>
        <div
          class="w-px h-8 bg-gradient-to-b from-transparent to-primary/30"
        ></div>
        <div class="w-1 h-1 rounded-full bg-primary/50 animate-pulse"></div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col relative overflow-hidden">
      <!-- TopAppBar -->
      <TopAppBar />

      <!-- Workspace -->
      <div
        class="flex-1 overflow-hidden relative bg-surface-container-low texture-bg"
      >
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>

      <!-- Footer -->
      <footer
        class="flex items-center px-8 lg:px-10 h-14 w-full z-50 bg-white/40 backdrop-blur-2xl border-t border-slate-200/20 shrink-0"
      >
        <!-- Poetry aligned to the left edge of the main content area -->
        <div class="flex items-center gap-4 group cursor-default">
          <span class="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-500"></span>
          <span class="text-slate-500/80 group-hover:text-primary/80 transition-colors duration-500 font-medium text-[13px] tracking-[0.4em] font-serif" style="font-family: 'STSong', 'SimSun', serif;">
            林花謝了春紅，太匆匆。無奈朝來寒雨，晚來風。
          </span>
        </div>
      </footer>
    </main>

    <!-- Rain Effect Overlay -->
    <RainOverlay />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SideNavBar from "./components/common/SideNavBar.vue";
import TopAppBar from "./components/common/TopAppBar.vue";
import RainOverlay from "./components/common/RainOverlay.vue";

const route = useRoute();

// Debug window route should render without app shell
const isDebugWindow = computed(() => route.path === "/debug-window");
</script>

<style>
/* Google Fonts - using Chinese mirror for accessibility */
@import url("https://fonts.googleapis.cn/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap");
@import url("https://fonts.googleapis.cn/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=fallback");
@import url("https://cdn.bootcdn.net/ajax/libs/opposans/3.1.0/index.min.css");

.material-symbols-outlined {
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
