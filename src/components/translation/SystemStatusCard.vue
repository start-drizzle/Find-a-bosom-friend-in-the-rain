<template>
  <div class="p-8 rounded-xl bg-primary text-white relative group overflow-hidden shadow-xl shadow-primary/10">
    <div class="absolute -top-4 -right-4 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
      <span class="material-symbols-outlined text-[80px]">cloud_done</span>
    </div>
    <h4 class="text-base font-black mb-1 font-headline tracking-wide">系统运行状态</h4>
    <p class="text-[9px] text-white/50 mb-6 font-bold tracking-tight uppercase">
      Core Neural Architecture Online
    </p>
    <div class="space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-1.5 rounded-full" :class="youdaoOnline ? 'bg-emerald-400' : 'bg-red-400'"></div>
        <span class="text-[9px] font-black tracking-[0.1em] text-white/80 uppercase">
          翻译引擎 {{ youdaoOnline ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-1.5 h-1.5 rounded-full" :class="yoloOnline ? 'bg-emerald-400' : 'bg-amber-400'"></div>
        <span class="text-[9px] font-black tracking-[0.1em] text-white/80 uppercase">
          视觉检测 {{ yoloOnline ? '就绪' : '离线' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useConnectivityCheck } from '@/composables/useConnectivityCheck';

const yoloOnline = ref(false);
const { youdaoOnline, startPolling, stopPolling, checkYoudao } = useConnectivityCheck();

async function checkYoloHealth() {
  try {
    const response = await fetch('https://startdrizzling.cn/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    yoloOnline.value = response.ok;
  } catch {
    yoloOnline.value = false;
  }
}

let yoloPollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  startPolling();
  checkYoloHealth();
  yoloPollTimer = setInterval(checkYoloHealth, 30000);
});

onUnmounted(() => {
  stopPolling();
  if (yoloPollTimer) {
    clearInterval(yoloPollTimer);
    yoloPollTimer = null;
  }
});
</script>
