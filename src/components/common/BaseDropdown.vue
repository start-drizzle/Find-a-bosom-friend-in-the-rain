<template>
  <div class="relative" :class="groupClass">
    <slot name="trigger" :is-open="isOpen" :toggle="toggle" />

    <transition name="dropdown">
      <div
        v-if="isOpen"
        :class="[positionClass, 'py-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden', panelClass]"
      >
        <div
          v-for="(item, index) in items"
          :key="itemKey(item)"
          @click.stop="handleSelect(item)"
          class="relative px-4 py-3 text-[12px] font-semibold cursor-pointer transition-all duration-200 flex items-center gap-3"
          :class="isItemSelected(item) ? 'text-primary bg-primary/5' : 'text-slate-600 hover:text-primary hover:bg-slate-50'"
        >
          <div
            v-if="index === 0"
            class="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          />
          <div class="relative w-6 h-6 flex items-center justify-center overflow-hidden">
            <div
              class="absolute inset-0 flex items-center justify-center transition-all duration-500"
              :class="isItemSelected(item) ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'"
            >
              <slot name="icon-unselected" :item="item" :index="index" />
            </div>
            <div
              class="absolute inset-0 flex items-center justify-center transition-all duration-500"
              :class="isItemSelected(item) ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90'"
            >
              <slot name="icon-selected" :item="item" :index="index" />
            </div>
          </div>
          <slot name="item-label" :item="item" :index="index" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts" generic="T">
import { computed, watch } from 'vue';
import { useDropdown } from '@/composables/useDropdown';

const props = withDefaults(defineProps<{
  modelValue: string;
  items: T[];
  itemKey: (item: T) => string;
  closeDelay?: number;
  position?: 'bottom' | 'top';
  panelClass?: string;
  group?: string;
}>(), {
  closeDelay: 300,
  position: 'bottom',
  panelClass: '',
  group: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { isOpen, toggle, selectAndClose } = useDropdown({ closeDelay: props.closeDelay });

const groupClass = computed(() => props.group ? `group/${props.group}` : '');

const positionClass = computed(() =>
  props.position === 'bottom'
    ? 'absolute bottom-full left-0 mb-2.5'
    : 'absolute top-full left-0 right-0 mt-2.5'
);

function isItemSelected(item: T): boolean {
  return props.modelValue === props.itemKey(item);
}

function handleSelect(item: T) {
  selectAndClose(() => emit('update:modelValue', props.itemKey(item)));
}

watch(() => props.modelValue, () => {
  if (isOpen.value) {
    selectAndClose(() => {});
  }
});
</script>
