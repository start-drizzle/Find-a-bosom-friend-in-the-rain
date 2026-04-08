import { computed } from 'vue'
import { useTranslationStore } from '@/stores/translationStore'

/**
 * Translation logic composable.
 *
 * Manages the translate/copy lifecycle, decoupled from UI and capture pipeline.
 * All shared state lives in the Pinia store.
 */
export function useTranslation() {
  const store = useTranslationStore()

  async function handleTranslate() {
    if (!store.inputText || store.translating) return

    store.translating = true
    try {
      const result = await window.ipcRenderer.translate(
        store.inputText,
        '中文',
        store.selectedLang,
        store.selectedModel,
      )

      if (result.error) {
        store.translatedText = `翻译失败: ${result.error}`
      } else {
        store.translatedText = result.translation || ''
      }
    } catch {
      store.translatedText = '翻译服务出错'
    } finally {
      store.translating = false
    }
  }

  async function copyTranslation() {
    if (!store.translatedText) return
    try {
      await navigator.clipboard.writeText(store.translatedText)
    } catch {
      // Clipboard API may fail in certain environments
    }
  }

  function handleVolume() {
    // TODO: TTS functionality
  }

  return {
    handleTranslate,
    copyTranslation,
    handleVolume,
  }
}
