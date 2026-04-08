<template>
  <section
    class="flex-1 p-10 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-y-auto bg-surface-container-low h-full custom-scrollbar texture-bg"
  >
    <!-- Left: Translation Areas -->
    <div class="lg:col-span-8 space-y-10">
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-5xl font-black font-headline text-primary tracking-tighter">
            实时翻译
          </h2>
          <div class="flex items-center gap-2 mt-3">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p class="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">
              Neural engine synchronized. System ready.
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-primary/5 transition-all text-on-surface-variant hover:text-primary border border-slate-100">
            <span class="material-symbols-outlined text-[20px]">history</span>
          </button>
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-primary/5 transition-all text-on-surface-variant hover:text-primary border border-slate-100">
            <span class="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </div>

      <!-- 状态提示区域 -->
      <div v-if="captureStatus !== 'idle'" class="flex items-center gap-3 px-4 py-3 rounded-xl" :class="statusClass">
        <span class="material-symbols-outlined text-xl">{{ statusIconName }}</span>
        <span class="text-sm font-medium">{{ captureMessage }}</span>
      </div>

      <div class="grid grid-rows-2 gap-8 h-[calc(100vh-320px)] overflow-visible">
        <TranslationInputPanel v-model="store.inputText" />
        <TranslationOutputPanel
          :translated-text="store.translatedText"
          :translating="store.translating"
          :latency-ms="latencyMs"
          :selected-lang="store.selectedLang"
          :languages="store.languages"
          :input-text="store.inputText"
          @translate="handleTranslate"
          @copy="copyTranslation"
          @ping="checkYoudao"
          @lang-change="store.selectedLang = $event"
          @volume="handleVolume"
        />
      </div>
    </div>

    <!-- Right Panel: Settings & Status -->
    <div class="lg:col-span-4 space-y-8">
      <SettingsPanel
        :selected-model="store.selectedModel"
        :model-options="store.modelOptions"
        @model-change="store.selectedModel = $event"
        @capture="handleCaptureClick"
      />
      <SystemStatusCard />
    </div>
  </section>
</template>

<script setup lang="ts">
import TranslationInputPanel from '@/components/translation/TranslationInputPanel.vue'
import TranslationOutputPanel from '@/components/translation/TranslationOutputPanel.vue'
import SettingsPanel from '@/components/translation/SettingsPanel.vue'
import SystemStatusCard from '@/components/translation/SystemStatusCard.vue'
import { useTranslationStore } from '@/stores/translationStore'
import { useTranslation } from '@/composables/useTranslation'
import { useCapturePipeline } from '@/composables/useCapturePipeline'

const store = useTranslationStore()
const { handleTranslate, copyTranslation, handleVolume } = useTranslation()
const {
  captureStatus,
  captureMessage,
  statusClass,
  statusIconName,
  latencyMs,
  checkYoudao,
  handleCaptureClick,
} = useCapturePipeline()
</script>
