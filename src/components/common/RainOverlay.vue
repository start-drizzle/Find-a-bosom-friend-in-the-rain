<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      class="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5"
    ></div>
    <div
      v-for="(drop, index) in rainDrops"
      :key="index"
      class="rain-drop"
      :style="{
        left: drop.left,
        animationDelay: drop.delay,
        animationDuration: drop.duration,
        opacity: drop.opacity,
        height: drop.height,
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
const rainDrops = Array.from({ length: 60 }, () => ({
  left: Math.random() * 100 + "%",
  delay: Math.random() * 5 + "s",
  duration: Math.random() * 0.4 + 0.4 + "s",
  opacity: Math.random() * 0.4 + 0.1,
  height: Math.random() * 20 + 20 + "px",
}));
</script>

<style scoped>
.rain-drop {
  position: absolute;
  top: -100px;
  width: 1px;
  background: linear-gradient(to bottom, transparent, #1d5876);
  animation: fall linear infinite;
  filter: blur(0.5px);
}

@keyframes fall {
  to {
    transform: translateY(100vh);
  }
}
</style>
