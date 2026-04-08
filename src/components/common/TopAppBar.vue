<template>
  <header
    class="flex justify-between items-center h-16 px-10 w-full bg-white/40 backdrop-blur-2xl border-b border-slate-200/20 z-40"
    style="-webkit-app-region: drag"
  >
    <div class="flex items-center gap-6">
      <button
        class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-all group"
        style="-webkit-app-region: no-drag"
      >
        <span
          class="material-symbols-outlined text-primary text-2xl group-hover:rotate-180 transition-transform duration-500"
          >menu_open</span
        >
      </button>
      <div class="flex items-center gap-3">
        <span
          class="text-[12px] font-black text-slate-800 font-headline tracking-[0.2em] uppercase"
          >Rainy Soulmate</span
        >
        <div class="w-1 h-1 rounded-full bg-slate-300"></div>
        <div
          class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
        >
          <div
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
          ></div>
          <span
            class="text-[9px] font-black text-emerald-600 uppercase tracking-widest"
            >System Active</span
          >
        </div>
      </div>
    </div>
    <!-- Window Controls -->
    <div
      class="flex items-center h-full -mr-6 gap-1"
      style="-webkit-app-region: no-drag"
    >
      <button
        @click="windowMinimize"
        class="group relative w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-black/[0.04]"
      >
        <svg
          width="12"
          height="1"
          viewBox="0 0 12 1"
          fill="none"
          class="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        >
          <rect width="12" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        @click="handleMaximize"
        class="group relative w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 transition-all duration-300 hover:bg-black/[0.04]"
      >
        <svg
          v-if="isMaximized"
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          class="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        >
          <rect
            x="2.5"
            y="0.5"
            width="8"
            height="8"
            stroke="currentColor"
            stroke-opacity="0.5"
          />
          <rect
            x="0.5"
            y="2.5"
            width="8"
            height="8"
            fill="white"
            stroke="currentColor"
            stroke-opacity="0.5"
          />
        </svg>
        <svg
          v-else
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          class="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        >
          <rect
            x="0.5"
            y="0.5"
            width="10"
            height="10"
            stroke="currentColor"
            stroke-opacity="0.5"
          />
        </svg>
      </button>
      <button
        @click="windowClose"
        class="group relative w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 transition-all duration-300 hover:bg-red-50"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          class="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
        >
          <path
            d="M1 1L11 11M11 1L1 11"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isMaximized = ref(false);

const windowMinimize = () => {
  window.ipcRenderer.windowMinimize();
};

const handleMaximize = async () => {
  isMaximized.value = await window.ipcRenderer.windowMaximize();
};

const windowClose = () => {
  window.ipcRenderer.windowClose();
};

const onWindowStateChanged = (_: unknown, maximized: boolean) => {
  isMaximized.value = maximized;
};

onMounted(async () => {
  isMaximized.value = await window.ipcRenderer.windowIsMaximized();
  window.ipcRenderer.on('window-state-changed', onWindowStateChanged);
});

onUnmounted(() => {
  window.ipcRenderer.off('window-state-changed', onWindowStateChanged);
});
</script>
