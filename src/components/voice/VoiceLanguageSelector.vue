<template>
  <div ref="dropdownRef" class="flex justify-center gap-4 flex-shrink-0 pt-2 w-full max-w-sm mx-auto">
    <!-- Source Language Selector -->
    <div class="flex-1 relative">
      <button
        @click="toggleDropdown"
        class="w-full flex items-center justify-between px-5 py-3.5 bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] rounded-[16px] hover:bg-white/80 hover:shadow-[0_4px_15px_-3px_rgba(29,88,118,0.08)] hover:border-primary/20 transition-all duration-500 group"
      >
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary/60 text-[18px]">language</span>
          <span class="text-[13px] font-medium text-slate-700 tracking-wide font-sans">{{ sourceLanguageLabel }}</span>
        </div>
        <span class="material-symbols-outlined text-slate-400 text-[18px] group-hover:text-primary transition-colors duration-300">keyboard_arrow_down</span>
      </button>

      <!-- Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          class="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <button
            v-for="lang in sourceLanguages"
            :key="lang.code"
            @click="selectLanguage(lang)"
            class="w-full px-4 py-3 text-left text-[13px] font-medium text-slate-700 hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between"
            :class="{ 'bg-primary/10 text-primary': selectedSourceLanguage === lang.code }"
          >
            <span>{{ lang.label }}</span>
            <span v-if="selectedSourceLanguage === lang.code" class="material-symbols-outlined text-primary text-[16px]">check</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Target Language Display (always Chinese) -->
    <div class="flex-1">
      <button
        class="w-full flex items-center justify-between px-5 py-3.5 bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] rounded-[16px] cursor-default"
      >
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary/60 text-[18px]">translate</span>
          <span class="text-[13px] font-medium text-slate-700 tracking-wide font-sans">中文</span>
        </div>
        <span class="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDropdown } from '@/composables/useDropdown';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const dropdownRef = ref<HTMLElement | null>(null);
const { isOpen, toggle, selectAndClose, onClickOutside } = useDropdown({
  closeDelay: 0,
  clickOutside: true,
});
onClickOutside(dropdownRef);

const sourceLanguages = [
  { code: 'auto', label: '自动检测' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
];

const selectedSourceLanguage = computed(() => props.modelValue);

const sourceLanguageLabel = computed(() => {
  const lang = sourceLanguages.find(l => l.code === props.modelValue);
  return lang?.label || '自动检测';
});

function toggleDropdown() {
  toggle();
}

function selectLanguage(lang: { code: string; label: string }) {
  selectAndClose(() => emit('update:modelValue', lang.code));
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
