<template>
  <div
    class="bubble-body group-hover:translate-brutal"
    :class="[sizeClass, { 'bubble-active': isActive, 'bubble-fade-white': isFinalizing }]"
  >
    <div class="bubble-inner">
      <div class="flex items-start gap-3">
        <span class="bubble-label bubble-label-src">SRC</span>
        <p class="bubble-src-text">{{ src }}</p>
      </div>
      <!-- Brutalist divider -->
      <div class="w-full flex items-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
        <div class="w-3 h-[2px] bg-black"></div>
        <div class="flex-1 h-[1px] bg-black/20"></div>
      </div>
      <div class="flex items-start gap-3">
        <span class="bubble-label bubble-label-trg">TRG</span>
        <p class="bubble-trg-text">{{ trg }}</p>
      </div>
    </div>
    <!-- Volume Button -->
    <div class="bubble-volume">
      <button class="volume-btn" @click="$emit('volume')">
        <span class="material-symbols-outlined text-[18px]">volume_up</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  src: string;
  trg: string;
  isActive?: boolean;
  isFinalizing?: boolean;
}>();

defineEmits<{
  volume: [];
}>();

const sizeClass = computed(() => {
  const textLength = props.src.length;
  if (textLength < 30) return 'p-3';
  if (textLength < 80) return 'p-4';
  return 'p-5';
});
</script>

<style scoped>
/* Bubble outer shell - thick border, hard shadow, no radius */
.bubble-body {
  position: relative;
  display: inline-block;
  background-color: #fff;
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.5s ease, border-color 0.5s ease;
  cursor: pointer;
  max-width: 95%;
}

.bubble-body:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #000;
}

.bubble-body:active {
  transform: translate(0px, 0px);
  box-shadow: 2px 2px 0 #000;
}

/* All bubbles float gently */
.bubble-body {
  animation: bubble-float 3s ease-in-out infinite;
  animation-composition: replace;
}

@keyframes bubble-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}

/* Active bubble */
.bubble-active {
  background-color: #bfdbfe;
  border: 2px solid #3b82f6;
  box-shadow: 4px 4px 0 #1d5876;
  animation:
    bubble-float 3s ease-in-out infinite,
    bubble-glow 2s ease-in-out infinite;
  animation-composition: replace;
}

@keyframes bubble-glow {
  0% {
    border-color: #3b82f6;
    box-shadow: 6px 6px 0 #1d5876, 0 0 12px rgba(59, 130, 246, 0.2);
  }
  50% {
    border-color: #60a5fa;
    box-shadow: 6px 6px 0 #2563eb, 0 0 24px rgba(96, 165, 250, 0.3);
  }
  100% {
    border-color: #3b82f6;
    box-shadow: 6px 6px 0 #1d5876, 0 0 12px rgba(59, 130, 246, 0.2);
  }
}

.bubble-active:hover {
  animation: bubble-hover 0.4s ease forwards;
  animation-composition: replace;
}

@keyframes bubble-hover {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-6px) scale(1.02); }
  100% { transform: translateY(-3px) scale(1); }
}

/* Fade from active bubble to white completed */
.bubble-fade-white {
  animation: fade-to-white 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-composition: replace;
}

@keyframes fade-to-white {
  0% {
    background-color: #bfdbfe;
    border-color: #60a5fa;
    box-shadow: 4px 4px 0 #2563eb, 0 0 20px rgba(96, 165, 250, 0.35);
  }
  25% {
    transform: scale(1.05);
    box-shadow: 6px 6px 0 #1d5876, 0 0 28px rgba(59, 130, 246, 0.3);
  }
  50% {
    background-color: #dbeafe;
    border-color: #93c5fd;
    box-shadow: 5px 5px 0 #444;
  }
  75% {
    background-color: #f5f5f5;
    border-color: #888;
    box-shadow: 4px 4px 0 #222;
  }
  100% {
    background-color: #fff;
    border-color: #000;
    box-shadow: 4px 4px 0 #000;
    transform: scale(1);
  }
}

/* TransitionGroup - completed bubble entrance */
.bubble-settle-enter-active {
  animation: bubble-land 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}
.bubble-settle-leave-active {
  animation: bubble-leave 0.4s ease forwards;
}

@keyframes bubble-land {
  0% { opacity: 0; transform: translateY(-24px) scale(0.88); }
  50% { opacity: 1; transform: translateY(5px) scale(1.03); }
  75% { transform: translateY(-2px) scale(0.99); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes bubble-leave {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.85) translateY(-12px); }
}

.translate-brutal {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 #3b82f6;
}

/* Inner content area */
.bubble-inner {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 100px;
  max-width: 95%;
}

/* Label styling */
.bubble-label {
  font-family: "Courier New", Courier, monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 1px 5px;
  border: 2px solid #000;
  line-height: 1;
}

.bubble-label-src {
  color: #000;
  background: transparent;
}

.bubble-label-trg {
  color: #fff;
  background: #000;
}

.bubble-active .bubble-label {
  border-color: #3b82f6;
}

.bubble-active .bubble-label-src {
  color: #1e40af;
}

.bubble-active .bubble-label-trg {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

/* Text styling */
.bubble-src-text {
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #000;
  line-height: 1.5;
  letter-spacing: 0.5px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.bubble-trg-text {
  font-family: "Courier New", Courier, monospace;
  font-size: 15px;
  font-weight: 700;
  color: #010101;
  line-height: 1.4;
  letter-spacing: 0.3px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.bubble-active .bubble-src-text {
  color: #1e3a5f;
}

.bubble-active .bubble-trg-text {
  color: #1e3a5f;
}

/* Volume button */
.bubble-volume {
  position: absolute;
  bottom: -4px;
  right: -4px;
  z-index: 10;
}

.volume-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 3px 3px 0 #000;
  color: #000;
  transition: all 0.15s ease;
  cursor: pointer;
}

.volume-btn:hover {
  background: #000;
  color: #fff;
  transform: translate(-2px, -2px);
  box-shadow: 5px 5px 0 #000;
}

.volume-btn:active {
  transform: translate(0, 0);
  box-shadow: 1px 1px 0 #000;
}
</style>
