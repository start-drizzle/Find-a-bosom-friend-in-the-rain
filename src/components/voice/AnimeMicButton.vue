<template>
  <div
    class="relative flex items-center justify-center group/mic cursor-pointer mt-4"
    @click="$emit('toggle')"
  >
    <!-- 手绘草稿风背景环 -->
    <div
      class="absolute inset-0 scale-[1.7] w-full h-full opacity-80 group-hover/mic:opacity-100 transition-all duration-500 flex items-center justify-center pointer-events-none"
    >
      <!-- 录音时的动漫光芒 -->
      <svg
        class="absolute w-full h-full transition-all duration-500 animate-anime-spin-slow"
        :class="isRecording ? 'opacity-100 scale-100' : 'opacity-0 scale-150 -rotate-90'"
        viewBox="0 0 100 100"
      >
        <path d="M50,0 L53,12 L47,12 Z M50,100 L53,88 L47,88 Z M0,50 L12,47 L12,53 Z M100,50 L88,47 L88,53 Z" fill="#0f172a" />
        <path d="M15,15 L25,20 L20,25 Z M85,85 L75,80 L80,75 Z M15,85 L20,75 L25,80 Z M85,15 L80,25 L75,20 Z" fill="#f59e0b" />
      </svg>
    </div>

    <!-- 核心麦克风按钮 -->
    <div
      class="relative w-[130px] h-[130px] flex items-center justify-center transition-transform duration-300 z-10 overflow-hidden anime-wobble-border group-hover/mic:-translate-y-2 group-active/mic:translate-y-1 group-active/mic:scale-95 bg-white"
      style="border: 4px solid #0f172a; box-shadow: 8px 8px 0px #0f172a;"
    >
      <!-- 动漫纯色底 -->
      <div
        class="absolute inset-0 transition-colors duration-300"
        :class="isRecording ? 'bg-[#fde047]' : 'bg-[#94a3b8]'"
      ></div>

      <!-- 赛璐璐硬阴影 -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M -10 60 Q 50 40 110 70 L 110 110 L -10 110 Z" fill="#334155"
          class="transition-opacity duration-300"
          :class="isRecording ? 'opacity-0' : 'opacity-100'"
        />
        <path
          d="M -10 50 Q 50 80 110 50 L 110 110 L -10 110 Z" fill="#f59e0b"
          class="transition-opacity duration-300"
          :class="isRecording ? 'opacity-100' : 'opacity-0'"
        />
      </svg>

      <!-- 动漫几何高光 (月牙形) -->
      <svg
        class="absolute top-2 left-2 w-[50%] h-[40%] pointer-events-none z-20 transition-transform duration-300 group-hover/mic:scale-110"
        viewBox="0 0 50 50"
      >
        <path d="M 5,25 Q 15,5 40,10 Q 25,18 10,35 Z" fill="#ffffff" />
        <circle cx="45" cy="5" r="4" fill="#ffffff" />
      </svg>

      <!-- 点击爆炸波纹 -->
      <div
        class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300"
        :class="isRecording ? 'opacity-100' : 'opacity-0'"
      >
        <div
          v-if="isRecording"
          class="w-full h-full border-[6px] border-white anime-action-flash rounded-full scale-150 opacity-0"
        ></div>
      </div>

      <!-- 图标容器 -->
      <div class="relative z-30 flex flex-col items-center justify-center w-full h-full group-hover/mic:scale-110 transition-transform duration-300">

        <!-- 待机状态：雷雨云 -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
          :class="isRecording ? 'opacity-0 scale-75 translate-y-8' : 'opacity-100 scale-100 translate-y-0'"
        >
          <div class="relative mt-1">
            <span
              class="material-symbols-outlined text-white text-[72px] leading-none absolute inset-0 translate-y-1 translate-x-1"
              style="font-variation-settings: 'FILL' 1, 'wght' 700; color: #0f172a;"
            >cloud</span>
            <span
              class="material-symbols-outlined text-white text-[72px] leading-none relative"
              style="font-variation-settings: 'FILL' 1, 'wght' 700; -webkit-text-stroke: 2px #0f172a;"
            >cloud</span>
          </div>
          <!-- 雨滴 -->
          <div class="flex gap-2 mt-0 px-2">
            <div class="w-[3px] h-6 bg-white border border-[#0f172a] rotate-[20deg] animate-anime-rain" style="box-shadow: 2px 2px 0px #0f172a;"></div>
            <div class="w-[2px] h-4 bg-white border border-[#0f172a] rotate-[20deg] animate-anime-rain delay-75 mt-2" style="box-shadow: 2px 2px 0px #0f172a;"></div>
            <div class="w-[3px] h-8 bg-white border border-[#0f172a] rotate-[20deg] animate-anime-rain delay-150" style="box-shadow: 2px 2px 0px #0f172a;"></div>
            <div class="w-[3px] h-5 bg-white border border-[#0f172a] rotate-[20deg] animate-anime-rain delay-300 mt-1" style="box-shadow: 2px 2px 0px #0f172a;"></div>
            <div class="w-[2px] h-7 bg-white border border-[#0f172a] rotate-[20deg] animate-anime-rain delay-200 -mt-1" style="box-shadow: 2px 2px 0px #0f172a;"></div>
          </div>
          <!-- 闪电 -->
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
            <svg class="absolute left-[18%] top-[35%] w-8 h-14 animate-anime-lightning" viewBox="0 0 32 56" fill="none">
              <path d="M18 0 L10 18 L16 18 L6 36 L14 36 L0 56 L12 32 L6 32 L14 18 L8 18 L18 0Z" fill="#0f172a"/>
              <path d="M16 2 L8 20 L14 20 L4 38 L12 38 L2 54 L10 34 L4 34 L12 20 L6 20 L16 2Z" fill="#fef9c3"/>
              <path d="M14 6 L10 16 L13 16 L6 30 L10 30 L14 16 L11 16 L14 6Z" fill="#ffffff"/>
            </svg>
            <svg class="absolute right-[20%] top-[40%] w-6 h-10 animate-anime-lightning delay-lightning" viewBox="0 0 24 40" fill="none">
              <path d="M14 0 L8 14 L12 14 L4 28 L10 28 L0 40 L8 26 L4 26 L10 14 L6 14 L14 0Z" fill="#0f172a"/>
              <path d="M12 2 L6 16 L10 16 L2 30 L8 30 L2 38 L6 26 L2 26 L8 16 L4 16 L12 2Z" fill="#fef9c3"/>
              <path d="M10 6 L6 14 L9 14 L4 24 L7 24 L10 14 L7 14 L10 6Z" fill="#ffffff"/>
            </svg>
          </div>
        </div>

        <!-- 录音状态：太阳 -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
          :class="isRecording ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-8'"
        >
          <div class="relative animate-anime-spin-slow">
            <span
              class="material-symbols-outlined text-white text-[76px] leading-none relative"
              style="font-variation-settings: 'FILL' 1, 'wght' 700; -webkit-text-stroke: 2px #0f172a;"
            >sunny</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 漫画对话框样式的文字框 -->
    <div class="absolute -bottom-20 flex flex-col items-center">
      <div
        class="px-3 py-1 bg-[#0f172a] border-2 border-[#0f172a] -skew-x-12 shadow-[4px_4px_0px_rgba(15,23,42,0.3)] transition-all duration-300"
        :class="isRecording ? 'bg-[#f59e0b]' : 'bg-[#0f172a]'"
      >
        <p class="text-[12px] font-black tracking-[0.2em] uppercase text-white skew-x-12">
          {{ isRecording ? 'TRANSLATING!!' : 'STANDBY...' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRecording: boolean;
}>();

defineEmits<{
  toggle: [];
}>();
</script>

<style scoped>
/* Anime Wobble Border */
.anime-wobble-border {
  border-radius: 47% 53% 45% 55% / 55% 45% 58% 42%;
  animation: wobble 4s ease-in-out infinite alternate;
}

@keyframes wobble {
  0% { border-radius: 47% 53% 45% 55% / 55% 45% 58% 42%; }
  33% { border-radius: 53% 47% 55% 45% / 45% 55% 42% 58%; }
  66% { border-radius: 45% 55% 42% 58% / 58% 42% 55% 45%; }
  100% { border-radius: 55% 45% 58% 42% / 42% 58% 45% 55%; }
}

/* 动漫风旋转 */
.animate-anime-spin-slow {
  animation: anime-spin 12s linear infinite;
}

@keyframes anime-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 动漫硬核下雨 */
@keyframes anime-rain {
  0% { transform: translateY(-10px) rotate(12deg); opacity: 0; }
  10% { opacity: 1; }
  90% { transform: translateY(15px) rotate(12deg); opacity: 1; }
  100% { transform: translateY(20px) rotate(12deg); opacity: 0; }
}

.animate-anime-rain {
  animation: anime-rain 0.6s steps(4) infinite;
}

.delay-75 { animation-delay: 0.075s; }
.delay-150 { animation-delay: 0.15s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }

/* 动漫动作线爆裂效果 */
@keyframes anime-action-flash {
  0% { transform: scale(1); opacity: 1; border-width: 10px; }
  100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
}

.anime-action-flash {
  animation: anime-action-flash 0.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
}

/* 日系动漫风闪电动画 */
@keyframes anime-lightning {
  0% { opacity: 0; transform: scaleY(0.3) translateY(-8px); }
  5% { opacity: 1; transform: scaleY(1) translateY(0); }
  10% { opacity: 1; transform: scaleY(1.05) translateY(1px); }
  15% { opacity: 0.3; transform: scaleY(0.95) translateY(-2px); }
  20% { opacity: 1; transform: scaleY(1) translateY(0); }
  25% { opacity: 0; transform: scaleY(0.8) translateY(-4px); }
  100% { opacity: 0; transform: scaleY(0.3) translateY(-8px); }
}

.animate-anime-lightning {
  animation: anime-lightning 3s steps(2) infinite;
  filter: drop-shadow(0 0 4px rgba(254, 249, 195, 0.8)) drop-shadow(0 0 8px rgba(250, 204, 21, 0.6));
}

.delay-lightning {
  animation-delay: 1.8s;
}
</style>
