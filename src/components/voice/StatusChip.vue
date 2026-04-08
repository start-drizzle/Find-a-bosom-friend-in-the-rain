<template>
  <div class="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-2xl rounded-full border border-slate-200/60 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-default">
    <div class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
    </div>
    <span class="text-[11px] font-mono font-bold text-slate-600 tracking-widest pt-px">{{ latency }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  latency?: string;
}>();
</script>
