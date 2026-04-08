import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ModelOption } from '@/types'

export const useTranslationStore = defineStore('translation', () => {
  // --- Translation state ---
  const inputText = ref('')
  const translatedText = ref('')
  const translating = ref(false)
  const selectedLang = ref('English')
  const selectedModel = ref('llm')

  // --- Static config ---
  const languages = ['English', '中文', '日本語', '한국어', 'Français', 'Español']

  const modelOptions: ModelOption[] = [
    { value: 'llm', name: '有道大模型翻译 (LLM)', desc: '基于大模型的智能翻译，更自然流畅' },
    { value: 'nmt', name: '有道神经翻译 (NMT)', desc: '快速准确的神经机器翻译' },
  ]

  // --- Connectivity ---
  const pingLatencyMs = ref(0)
  const latencyMs = computed(() => pingLatencyMs.value)

  return {
    inputText,
    translatedText,
    translating,
    selectedLang,
    selectedModel,
    languages,
    modelOptions,
    pingLatencyMs,
    latencyMs,
  }
})
