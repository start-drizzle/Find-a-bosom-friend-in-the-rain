<template>
  <BaseDropdown
    :model-value="modelValue"
    :items="devices"
    :item-key="(device) => device.deviceId"
    :close-delay="300"
    position="bottom"
    panel-class="min-w-[200px] border border-white/50 z-[9999]"
    group="mic"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #trigger="{ isOpen, toggle }">
      <button
        @click.stop="toggle()"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all backdrop-blur-xl border border-white/10 text-white/80 hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="opacity-80">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span class="text-[11px] font-bold tracking-wide">{{ selectedLabel }}</span>
        <span
          class="material-symbols-outlined text-[14px] opacity-60 transition-transform duration-300"
          :class="isOpen ? 'rotate-180' : ''"
        >expand_more</span>
      </button>
    </template>

    <template #icon-unselected>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-slate-400">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.4" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </template>

    <template #icon-selected>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-primary animate-pulse">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </template>

    <template #item-label="{ item: device, index }">
      <span>{{ getDeviceLabel(device, index) }}</span>
    </template>
  </BaseDropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseDropdown from '@/components/common/BaseDropdown.vue';

const props = defineProps<{
  modelValue: string;
  devices: MediaDeviceInfo[];
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedLabel = computed(() => {
  const selected = props.devices.find((d) => d.deviceId === props.modelValue);
  return selected ? getDeviceLabel(selected, -1) : 'Select Mic';
});

function getDeviceLabel(device: MediaDeviceInfo, index: number): string {
  if (device.label && device.label.trim()) {
    return device.label;
  }
  return `Microphone ${index + 1}`;
}
</script>
