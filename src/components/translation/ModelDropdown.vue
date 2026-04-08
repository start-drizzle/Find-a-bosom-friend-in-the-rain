<template>
  <BaseDropdown
    :model-value="modelValue"
    :items="options"
    :item-key="(model) => model.value"
    :close-delay="500"
    position="top"
    panel-class="min-w-[220px] border border-slate-100/50 z-50"
    group="model"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #trigger="{ isOpen, toggle }">
      <button
        @click.stop="toggle()"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/80 backdrop-blur-xl border border-slate-200/50 text-on-surface hover:border-primary/30 hover:bg-surface/90 transition-all duration-300"
      >
        <div class="relative w-7 h-6 flex items-center justify-center overflow-hidden">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" class="transition-all duration-500">
            <ellipse cx="12" cy="15" rx="7" ry="4" fill="#94a3b8" opacity="0.15" />
            <path d="M7 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6" />
            <circle cx="9.5" cy="10.5" r="1" fill="#a78bfa" class="animate-fogPulse" />
            <circle cx="12" cy="9" r="1.2" fill="#818cf8" class="animate-fogPulse2" />
            <circle cx="14.5" cy="10.5" r="0.8" fill="#a78bfa" class="animate-fogPulse3" />
            <circle cx="11" cy="7" r="0.6" fill="#c4b5fd" opacity="0.7" class="animate-fogRise" />
            <circle cx="13" cy="6" r="0.5" fill="#ddd6fe" opacity="0.5" class="animate-fogRise2" />
          </svg>
        </div>
        <span class="text-xs font-bold flex-1 text-left">{{ selectedModelName }}</span>
        <span
          class="material-symbols-outlined text-slate-400 text-lg transition-transform duration-300"
          :class="isOpen ? 'rotate-180' : ''"
        >expand_more</span>
      </button>
    </template>

    <template #icon-unselected>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-slate-300">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.3" />
        <circle cx="8" cy="16" r="1.5" fill="currentColor" class="animate-rainDrop1" />
        <circle cx="12" cy="18" r="1.5" fill="currentColor" class="animate-rainDrop2" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" class="animate-rainDrop3" />
      </svg>
    </template>

    <template #icon-selected>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="animate-sunGlow">
        <circle cx="12" cy="12" r="5" fill="#fbbf24" />
        <g stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.7">
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

    <template #item-label="{ item: model }">
      <div class="flex-1">
        <span>{{ model.name }}</span>
      </div>
    </template>
  </BaseDropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseDropdown from '@/components/common/BaseDropdown.vue';
import type { ModelOption } from '@/types';

const props = defineProps<{
  modelValue: string;
  options: ModelOption[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedModelName = computed(
  () => props.options.find((m) => m.value === props.modelValue)?.name || '',
);
</script>
