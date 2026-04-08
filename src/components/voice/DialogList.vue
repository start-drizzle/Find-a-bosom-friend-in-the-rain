<template>
  <div ref="scrollContainer" class="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-8 relative pt-8">
    <!-- Vertical timeline guide line -->
    <div class="absolute left-6 top-12 bottom-0 w-px bg-gradient-to-b from-primary/10 via-slate-200/30 to-transparent -z-10"></div>

    <!-- Completed Bubbles -->
    <TransitionGroup name="bubble-settle" tag="div" class="contents">
      <div
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="relative pl-12 group mb-6"
      >
        <!-- Timeline Node -->
        <div class="absolute left-[21px] top-8 w-2 h-2 rounded-full bg-white border-2 border-primary shadow-[0_0_10px_rgba(29,88,118,0.3)] z-10 transition-transform duration-500 group-hover:scale-125"></div>
        <!-- Connecting Line -->
        <div class="absolute left-[25px] top-[35px] w-8 h-px bg-primary/10 z-0"></div>
        <!-- Bubble -->
        <ChatBubble
          :src="bubble.src"
          :trg="bubble.trg"
          @volume="$emit('volume', bubble.id)"
        />
      </div>
    </TransitionGroup>

    <!-- Active Bubble (being edited) -->
    <div v-if="currentSrc" class="relative pl-12 group">
      <!-- Timeline Node -->
      <div class="absolute left-[21px] top-8 w-2 h-2 rounded-full bg-white border-2 border-primary shadow-[0_0_10px_rgba(29,88,118,0.3)] z-10 transition-transform duration-500 group-hover:scale-125"></div>
      <!-- Connecting Line -->
      <div class="absolute left-[25px] top-[35px] w-8 h-px bg-primary/10 z-0"></div>
      <ChatBubble
        :src="currentSrc"
        :trg="currentTrg"
        :is-active="true"
        :is-finalizing="bubbleFinalizing"
        @volume="$emit('volumeActive')"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="!currentSrc && bubbles.length === 0"
      class="flex items-center justify-center h-full text-slate-400/50 text-sm font-medium"
    >
      <p>输入文本开始翻译...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import ChatBubble from './ChatBubble.vue';
import type { Bubble } from '@/types';

defineProps<{
  bubbles: Bubble[];
  currentSrc: string;
  currentTrg: string;
  bubbleFinalizing: boolean;
}>();

defineEmits<{
  volume: [id: number];
  volumeActive: [];
}>();

const scrollContainer = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
  });
}

// Expose scroll method for parent
defineExpose({ scrollToBottom });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(226, 232, 240, 0.6);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(203, 213, 225, 0.8);
}
</style>
