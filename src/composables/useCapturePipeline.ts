import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTranslationStore } from '@/stores/translationStore'
import { useConnectivityCheck } from '@/composables/useConnectivityCheck'
import { useTranslation } from '@/composables/useTranslation'

type CaptureStatus = 'idle' | 'capturing' | 'uploading' | 'success' | 'error'

const STATUS_RESET_DELAY_MS = 3000

/**
 * Capture → YOLO → OCR → translate pipeline composable.
 *
 * Handles the full Ctrl+P/Ctrl+L hotkey flow, IPC listeners for crop/OCR
 * results, and the manual "capture" button. Delegates translation to
 * useTranslation composable.
 */
export function useCapturePipeline() {
  const store = useTranslationStore()
  const { handleTranslate } = useTranslation()

  const captureStatus = ref<CaptureStatus>('idle')
  const captureMessage = ref('')

  const { latencyMs: pingLatency, checkYoudao, silentPing } = useConnectivityCheck()
  store.pingLatencyMs = pingLatency.value
  // Keep store latency in sync
  const latencyMs = computed(() => pingLatency.value)

  const statusClass = computed(() => {
    switch (captureStatus.value) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
      case 'error':
        return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'capturing':
      case 'uploading':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
      default:
        return ''
    }
  })

  const statusIconName = computed(() => {
    switch (captureStatus.value) {
      case 'success':
        return 'check_circle'
      case 'error':
        return 'error'
      case 'capturing':
        return 'screenshot'
      case 'uploading':
        return 'cloud_upload'
      default:
        return 'info'
    }
  })

  function resetStatusAfterDelay() {
    setTimeout(() => {
      if (captureStatus.value !== 'uploading' && captureStatus.value !== 'capturing') {
        captureStatus.value = 'idle'
        captureMessage.value = ''
      }
    }, STATUS_RESET_DELAY_MS)
  }

  // --- IPC handlers ---

  function onCropResult(_event: unknown, result: { success: boolean; saved: number; paths: string[]; error?: string }) {
    if (result.success) {
      captureStatus.value = 'success'
      captureMessage.value = `截图成功！已保存 ${result.saved} 张到 test_crops/`
    } else {
      captureStatus.value = 'error'
      captureMessage.value = result.error || '截图失败'
    }
    resetStatusAfterDelay()
  }

  function onOcrResult(_event: unknown, result: { success: boolean; text: string; error?: string }) {
    if (result.success && result.text) {
      store.inputText = result.text
      captureStatus.value = 'success'
      captureMessage.value = `OCR 识别成功！原文: ${result.text.slice(0, 30)}...`
    } else {
      captureStatus.value = 'error'
      captureMessage.value = result.error || 'OCR 识别失败'
    }
    resetStatusAfterDelay()
  }

  async function onTriggerCapture() {
    await handleCaptureClick()
  }

  async function onTriggerTranslate(_event: unknown, data: { text: string }) {
    if (data.text) {
      store.inputText = data.text
    }
    await handleTranslate()
    if (store.translatedText) {
      window.ipcRenderer.notifyTranslationComplete(store.translatedText)
    }
  }

  // --- Main actions ---

  async function handleCaptureClick() {
    if (captureStatus.value !== 'idle') return

    captureStatus.value = 'capturing'
    captureMessage.value = '正在截图...'

    try {
      const captureResult = await window.ipcRenderer.captureScreen()
      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.error || '截图失败')
      }

      captureStatus.value = 'uploading'
      captureMessage.value = '正在识别坐标...'

      const yoloResult = await window.ipcRenderer.yoloDetect({
        imageData: captureResult.data,
        width: captureResult.width ?? 0,
        height: captureResult.height ?? 0,
      })

      if (yoloResult.success && yoloResult.detections) {
        window.ipcRenderer.storeYoloCoords(yoloResult.detections)
        captureStatus.value = 'success'
        captureMessage.value = `识别成功！检测到 ${yoloResult.count} 个目标，已保存坐标`
      } else {
        throw new Error(yoloResult.error || 'YOLO 识别失败')
      }
    } catch (err) {
      console.error('[Capture] Error:', err)
      captureStatus.value = 'error'
      captureMessage.value = err instanceof Error ? err.message : '截图/识别失败'
    }

    resetStatusAfterDelay()
  }

  // --- Lifecycle ---

  onMounted(() => {
    setTimeout(() => {
      silentPing(() => {
        setTimeout(() => checkYoudao(), 300)
      })
    }, 100)

    window.ipcRenderer.on('yolo:crop-result', onCropResult)
    window.ipcRenderer.on('ocr:result', onOcrResult)
    window.ipcRenderer.on('trigger-capture', onTriggerCapture)
    window.ipcRenderer.on('trigger:translate', onTriggerTranslate)
  })

  onUnmounted(() => {
    window.ipcRenderer.off('yolo:crop-result', onCropResult)
    window.ipcRenderer.off('ocr:result', onOcrResult)
    window.ipcRenderer.off('trigger:translate', onTriggerTranslate)
    window.ipcRenderer.off('trigger-capture', onTriggerCapture)
  })

  return {
    captureStatus,
    captureMessage,
    statusClass,
    statusIconName,
    latencyMs,
    checkYoudao,
    handleCaptureClick,
  }
}
