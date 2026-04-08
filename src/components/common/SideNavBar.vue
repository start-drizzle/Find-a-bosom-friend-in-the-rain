<template>
  <aside
    class="flex flex-col p-6 gap-3 sidebar-glass h-screen w-72 shrink-0 z-50"
  >
    <div class="mb-14 px-2 mt-12">
      <div class="flex items-center gap-5">
        <div class="relative group shrink-0">
          <div
            class="absolute -inset-1.5 bg-gradient-to-br from-primary to-primary/20 rounded-2xl blur-lg opacity-25 group-hover:opacity-45 transition-all duration-700"
          ></div>
          <div
            class="relative w-11 h-11 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center border border-white/50 shadow-lg shadow-primary/10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-primary"
            >
              <path
                d="M17.5 15.5C19.433 15.5 21 13.933 21 12C21 10.067 19.433 8.5 17.5 8.5C17.353 8.5 17.208 8.509 17.066 8.527C16.788 7.911 16.632 7.224 16.632 6.5C16.632 4.567 15.065 3 13.132 3C11.199 3 9.632 4.567 9.632 6.5C9.632 6.647 9.641 6.792 9.659 6.934C9.043 6.656 8.356 6.5 7.632 6.5C5.699 6.5 4.132 8.067 4.132 10C4.132 11.933 5.699 13.5 7.632 13.5C7.779 13.5 7.924 13.491 8.066 13.473C8.344 14.089 8.5 14.776 8.5 15.5C8.5 17.433 10.067 19 12 19C13.933 19 15.5 17.433 15.5 15.5C15.5 15.353 15.491 15.208 15.473 15.066C16.089 15.344 16.776 15.5 17.5 15.5Z"
                fill="currentColor"
              />
              <path
                d="M8 20L7.5 22"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M11 20L10.5 22"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M14 20L13.5 22"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <path
                d="M17 20L16.5 22"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
        <div class="flex flex-col justify-center">
          <h1
            class="text-2xl font-black text-primary tracking-tight leading-none font-headline"
          >
            Drizzle
          </h1>
          <div class="flex items-center gap-2 mt-2.5">
            <div
              class="flex flex-col gap-px text-[11px] text-slate-500/90 tracking-widest leading-relaxed"
              style="font-family: 'OPPO Sans', 'PingFang SC', sans-serif"
            >
              <span>月下何</span>
              <span>遇知己</span>
            </div>
            <div
              class="w-px h-7 bg-gradient-to-b from-transparent via-primary/30 to-transparent"
            ></div>
            <div
              class="flex flex-col gap-px text-[11px] text-slate-500/90 tracking-widest leading-relaxed"
              style="font-family: 'OPPO Sans', 'PingFang SC', sans-serif"
            >
              <span>雨中獨</span>
              <span>譯知音</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <nav class="flex flex-col gap-1.5">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative"
        :class="[
          route.path === item.path
            ? 'text-primary'
            : 'text-slate-500 hover:text-primary',
        ]"
      >
        <!-- Active Background (Smooth Glass) -->
        <div
          class="absolute inset-0 bg-primary/5 rounded-2xl border border-primary/10 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.05)] transition-all duration-500"
          :class="
            route.path === item.path
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none'
          "
        ></div>

        <!-- Active Indicator (Glow Line) -->
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)] transition-all duration-500"
          :class="
            route.path === item.path
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-2 pointer-events-none'
          "
        ></div>

        <span
          class="material-symbols-outlined text-[22px] transition-all duration-500 group-hover:scale-110 relative z-10"
          :class="{ 'font-medium': route.path === item.path }"
          >{{ item.icon }}</span
        >
        <span
          class="text-[13px] tracking-wide font-headline font-bold relative z-10"
          >{{ item.label }}</span
        >

        <!-- Hover Effect (Subtle Scale & Glow) -->
        <div
          class="absolute inset-0 bg-slate-400/0 group-hover:bg-slate-400/5 rounded-2xl transition-all duration-500 -z-10"
        ></div>
      </router-link>
    </nav>

    <div
      class="mt-auto p-5 bg-slate-900 rounded-2xl shadow-xl relative overflow-hidden group"
    >
      <div
        class="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/30 transition-all duration-700"
      ></div>
      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-5">
          <div
            class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10 backdrop-blur-sm"
          >
            <span class="material-symbols-outlined text-xl">bolt</span>
          </div>
          <div>
            <p
              class="text-[9px] font-black text-primary tracking-[0.2em] uppercase mb-0.5"
            >
              Pro Active
            </p>
            <p class="text-[11px] text-slate-400 font-bold">
              Unlimited Access
            </p>
          </div>
        </div>
        <button
          class="w-full py-3.5 bg-white text-slate-900 text-[11px] font-black rounded-xl hover:bg-primary hover:text-white transition-all duration-500 tracking-[0.2em] uppercase shadow-lg shadow-black/20"
        >
          Manage Plan
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { navItems } from '@/router'

const route = useRoute()
</script>

<style scoped>
.sidebar-glass {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: saturate(180%) blur(40px);
  -webkit-backdrop-filter: saturate(180%) blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
