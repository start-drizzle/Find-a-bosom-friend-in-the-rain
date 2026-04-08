<template>
  <div class="group relative bg-primary rounded-xl p-8 shadow-xl shadow-primary/10 z-10">
    <div class="absolute inset-0 opacity-5 pointer-events-none">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
    </div>
    <div class="absolute top-6 right-8 flex items-center gap-2 z-10">
      <span class="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">
        翻译结果
      </span>
      <span class="material-symbols-outlined text-white/40 text-sm">auto_awesome</span>
    </div>
    <div class="h-full flex flex-col relative z-10">
      <div
        class="w-full flex-1 text-2xl font-bold leading-relaxed text-white/95 selection:bg-white/20"
      >
        <template v-if="translatedText">{{ translatedText }}</template>
        <template v-else-if="translating">
          <span class="opacity-50">翻译中...</span>
        </template>
        <template v-else>
          <span class="opacity-50">等待翻译输出...</span>
        </template>
      </div>
      <div class="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
        <div class="flex items-center gap-3">
          <LanguageDropdown
            :model-value="selectedLang"
            :languages="languages"
            @update:model-value="$emit('langChange', $event)"
          />
          <button
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10"
            @click="$emit('volume')"
          >
            <span class="material-symbols-outlined text-[20px]">volume_up</span>
          </button>
          <button
            @click="$emit('copy')"
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10"
          >
            <span class="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
        </div>
        <div class="flex items-center gap-4">
          <div
            @click="$emit('ping')"
            class="px-4 py-2 rounded-xl bg-black/10 backdrop-blur-xl border border-white/5 flex items-center gap-2.5 cursor-pointer hover:bg-black/15 transition-all"
          >
            <div
              class="w-1 h-1 rounded-full"
              :class="latencyMs > 0 ? 'bg-emerald-400' : 'bg-amber-400'"
            ></div>
            <span class="text-[9px] font-black text-white/60 tracking-[0.2em]">
              {{ latencyMs > 0 ? latencyMs + 'MS' : '--' }}
            </span>
          </div>
          <button
            @click="$emit('translate')"
            :disabled="translating || !inputText"
            class="w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-lg"
            :class="
              inputText && !translating
                ? 'bg-white text-primary hover:bg-primary-container'
                : 'bg-white/30 text-white/30 cursor-not-allowed'
            "
          >
            <span
              v-if="!translating"
              class="material-symbols-outlined text-[20px]"
            >send</span>
            <span
              v-else
              class="material-symbols-outlined text-[20px] animate-spin"
            >progress_activity</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LanguageDropdown from './LanguageDropdown.vue';

defineProps<{
  translatedText: string;
  translating: boolean;
  latencyMs: number;
  selectedLang: string;
  languages: string[];
  inputText: string;
}>();

defineEmits<{
  translate: [];
  copy: [];
  ping: [];
  langChange: [lang: string];
  volume: [];
}>();
</script>
