import { ref, nextTick, onUnmounted, type Ref } from 'vue';
import type { Bubble } from '@/types';

export interface UseChatBubblesOptions {
  dialogListRef: Ref<{ scrollToBottom: () => void } | null>;
}

export function useChatBubbles(options: UseChatBubblesOptions) {
  const { dialogListRef } = options;

  const inputText = ref('');
  const bubbles = ref<Bubble[]>([]);
  const currentSrc = ref('');
  const currentTrg = ref('');
  const bubbleFinalizing = ref(false);

  let finalizeTimer: ReturnType<typeof setTimeout> | null = null;

  function scrollToBottom() {
    nextTick(() => {
      dialogListRef.value?.scrollToBottom();
    });
  }

  function updateCurrentSrc(text: string) {
    currentSrc.value = text;
    scrollToBottom();
  }

  function endBubble() {
    if (!currentSrc.value) return;

    bubbleFinalizing.value = true;
    const finalSrc = currentSrc.value;
    const finalTrg = currentTrg.value;

    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimer = null;
    }

    finalizeTimer = setTimeout(() => {
      bubbles.value.push({
        id: Date.now(),
        src: finalSrc,
        trg: finalTrg,
      });
      if (currentSrc.value === finalSrc) {
        currentSrc.value = '';
        currentTrg.value = '';
      }
      bubbleFinalizing.value = false;
      finalizeTimer = null;
      scrollToBottom();
    }, 500);
  }

  function resetAll() {
    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimer = null;
    }
    currentSrc.value = '';
    currentTrg.value = '';
    bubbles.value = [];
    bubbleFinalizing.value = false;
    inputText.value = '';
  }

  function handleEnter() {
    if (!inputText.value.trim()) return;

    if (currentSrc.value) {
      currentSrc.value += inputText.value;
    } else {
      currentSrc.value = inputText.value;
    }

    inputText.value = '';
    scrollToBottom();
  }

  onUnmounted(() => {
    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimer = null;
    }
  });

  return {
    inputText,
    bubbles,
    currentSrc,
    currentTrg,
    bubbleFinalizing,
    updateCurrentSrc,
    endBubble,
    resetAll,
    handleEnter,
    scrollToBottom,
  };
}
