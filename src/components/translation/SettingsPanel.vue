<template>
  <div
    class="bg-surface-container/60 backdrop-blur-2xl rounded-xl p-8 border border-slate-100 shadow-sm flex flex-col gap-8"
  >
    <!-- 功能配置 -->
    <div>
      <h3 class="text-[10px] font-black text-primary font-headline mb-6 flex items-center gap-2.5 tracking-[0.2em] uppercase">
        <span class="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
          <span class="material-symbols-outlined text-xs">settings</span>
        </span>
        功能配置
      </h3>
      <div class="space-y-6">
        <!-- AI 翻译模型 -->
        <div class="space-y-2">
          <label class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
            AI 翻译模型
          </label>
          <ModelDropdown
            :model-value="selectedModel"
            :options="modelOptions"
            @update:model-value="$emit('modelChange', $event)"
          />
        </div>
        <!-- OCR 识别引擎 -->
        <div class="space-y-2">
          <label class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
            OCR 识别引擎
          </label>
          <div class="relative group">
            <select class="w-full appearance-none bg-surface border border-slate-100 rounded-xl px-5 py-3.5 text-xs font-bold text-on-surface focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all">
              <option>Drizzle Vision Engine</option>
              <option>PaddleOCR Fast</option>
            </select>
            <span class="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-primary transition-colors text-lg">
              keyboard_arrow_down
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 自动处理 -->
    <div class="pt-2">
      <div class="flex items-center justify-between p-5 bg-surface/40 rounded-2xl border border-slate-50">
        <div>
          <p class="text-[13px] font-black text-on-surface font-headline">自动处理</p>
          <p class="text-[9px] text-on-surface-variant font-bold mt-0.5 uppercase tracking-wider">
            即时流式翻译
          </p>
        </div>
        <button class="w-12 h-6.5 rounded-full bg-primary relative flex items-center px-1 transition-all">
          <div class="ml-auto w-4.5 h-4.5 rounded-full bg-white shadow-sm"></div>
        </button>
      </div>
    </div>

    <!-- 输出区域定位 -->
    <div class="space-y-4">
      <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1">
        输出区域定位
      </p>
      <div class="p-6 bg-surface/40 rounded-xl border border-slate-50 group hover:border-primary/20 transition-all">
        <div class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1 text-center">
              <p class="text-[8px] text-on-surface-variant font-black uppercase tracking-widest">
                X 轴坐标
              </p>
              <div class="text-2xl font-black text-primary font-headline">
                124<span class="text-[9px] ml-1 text-slate-300">PX</span>
              </div>
            </div>
            <div class="space-y-1 text-center">
              <p class="text-[8px] text-on-surface-variant font-black uppercase tracking-widest">
                Y 轴坐标
              </p>
              <div class="text-2xl font-black text-primary font-headline">
                82<span class="text-[9px] ml-1 text-slate-300">PX</span>
              </div>
            </div>
          </div>
          <button
            @click="$emit('capture')"
            class="w-full py-3.5 bg-primary text-white rounded-xl flex items-center justify-center gap-2.5 hover:shadow-xl hover:shadow-primary/30 transition-all transform active:scale-[0.98]"
          >
            <span class="material-symbols-outlined text-lg">near_me</span>
            <span class="text-[10px] font-black uppercase tracking-widest">重新定位区域</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 系统快捷键 -->
    <div class="pt-6 border-t border-slate-50">
      <p class="text-[9px] font-black text-on-surface-variant uppercase tracking-widest ml-1 mb-4">
        系统快捷键
      </p>
      <div class="flex items-center justify-between px-5 py-4 bg-surface/30 rounded-xl border border-slate-50/50">
        <span class="text-[10px] font-black text-on-surface-variant uppercase tracking-tight">
          屏幕捕捉
        </span>
        <div class="flex gap-1.5">
          <kbd class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-primary">Ctrl</kbd>
          <kbd class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-primary">Alt</kbd>
          <kbd class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-primary">F</kbd>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ModelDropdown from './ModelDropdown.vue';
import type { ModelOption } from '@/types';

defineProps<{
  selectedModel: string;
  modelOptions: ModelOption[];
}>();

defineEmits<{
  modelChange: [value: string];
  capture: [];
}>();
</script>
