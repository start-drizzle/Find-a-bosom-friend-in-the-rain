<template>
  <div
    class="group relative bg-surface-container rounded-xl p-8 border border-slate-100 transition-all duration-500 hover:border-primary/20 overflow-hidden"
  >
    <div class="absolute inset-0 precision-grid opacity-[0.01] pointer-events-none"></div>
    <div class="absolute top-6 right-8 flex items-center gap-2">
      <span class="text-[9px] font-black text-primary/40 tracking-[0.2em] uppercase">
        原文解析
      </span>
      <div class="w-1.5 h-1.5 rounded-full bg-primary/20"></div>
    </div>
    <div class="h-full flex flex-col relative z-10">
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        class="w-full flex-1 bg-transparent border-none focus:ring-0 text-xl font-medium leading-relaxed text-on-surface placeholder:text-slate-200 resize-none p-0"
        placeholder="在此输入或粘贴原文..."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.precision-grid {
  background-size: 20px 20px;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
}
</style>
