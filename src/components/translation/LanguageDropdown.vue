<template>
  <BaseDropdown
    :model-value="modelValue"
    :items="languages"
    :item-key="(lang) => lang"
    :close-delay="500"
    position="bottom"
    panel-class="min-w-[160px] border border-white/50 z-[9999]"
    group="lang"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #trigger="{ isOpen, toggle }">
      <button
        @click.stop="toggle()"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all backdrop-blur-xl border border-white/10 text-white/80 hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="opacity-80">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
          <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" stroke-width="1.5" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span class="text-[11px] font-bold tracking-wide">{{ modelValue }}</span>
        <span
          class="material-symbols-outlined text-[14px] opacity-60 transition-transform duration-300"
          :class="isOpen ? 'rotate-180' : ''"
        >expand_more</span>
      </button>
    </template>

    <template #icon-unselected>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-slate-300">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" class="animate-rainDrop1" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" class="animate-rainDrop2" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" class="animate-rainDrop3" />
      </svg>
    </template>

    <template #icon-selected>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="animate-sunGlow">
        <circle cx="12" cy="12" r="5" fill="#fbbf24" class="text-amber-400" />
        <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round" class="text-amber-300">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </template>

    <template #item-label="{ item: lang }">
      <span>{{ lang }}</span>
    </template>
  </BaseDropdown>
</template>

<script setup lang="ts">
import BaseDropdown from '@/components/common/BaseDropdown.vue';

defineProps<{
  modelValue: string;
  languages: string[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
