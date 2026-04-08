<template>
  <div class="p-4 bg-slate-900/90 rounded-xl text-white font-mono text-sm flex-shrink-0">
    <div class="flex gap-4 mb-3">
      <span class="text-green-400">[1] Enter to add</span>
      <button
        @click="$emit('endBubble')"
        :class="modelValue ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600'"
        class="transition-colors"
      >[2] End bubble</button>
      <button
        @click="$emit('newBubble')"
        class="text-slate-400 hover:text-green-400 transition-colors"
      >[3] New bubble</button>
    </div>
    <div class="flex gap-2">
      <span class="text-green-400">></span>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('enter')"
        class="flex-1 bg-transparent outline-none text-slate-100 placeholder-slate-500"
        placeholder="Type text and press Enter..."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  enter: [];
  endBubble: [];
  newBubble: [];
}>();
</script>
