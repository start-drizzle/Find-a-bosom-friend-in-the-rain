import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import {
  enumerateAudioDevices,
  createAudioContext,
  type AudioController,
} from '@/utils/audio';
import { setRecordingGuard } from '@/router';
import { useDebugWindow } from '@/composables/useDebugWindow';

interface UseRecordingOptions {
  sourceLanguage: Ref<string>;
  updateCurrentSrc: (text: string) => void;
  endBubble: () => void;
  resetBubbles: () => void;
  currentSrc: Ref<string>;
}

const DISPLAY_DELAY_MS = 100;
const TEXT_SILENCE_TIMEOUT_MS = 3000;

export function useRecording(options: UseRecordingOptions) {
  const { sourceLanguage, updateCurrentSrc, endBubble, resetBubbles, currentSrc } = options;

  const isRecording = ref(false);
  const isStarting = ref(false);
  const isStopping = ref(false);

  const audioController = ref<AudioController | null>(null);
  const availableDevices = ref<MediaDeviceInfo[]>([]);
  const selectedDeviceId = ref<string>('');

  let textSilenceInterval: ReturnType<typeof setInterval> | null = null;
  let lastTextTime = 0;
  let displayTimeout: ReturnType<typeof setTimeout> | null = null;

  const debugWindow = useDebugWindow({
    onWindowClosed: () => stopRecording(),
  });

  // --- Microphone setup ---

  async function setupMicrophone() {
    try {
      availableDevices.value = await enumerateAudioDevices();
      if (availableDevices.value.length > 0 && !selectedDeviceId.value) {
        selectedDeviceId.value = availableDevices.value[0].deviceId;
      }
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  }

  // --- Recording control ---

  async function toggleRecording() {
    if (isRecording.value) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    if (isStarting.value) return;
    isStarting.value = true;
    try {
      lastTextTime = Date.now();
      resetBubbles();

      audioController.value = await createAudioContext(
        selectedDeviceId.value || undefined,
      );

      await window.ipcRenderer.asrStart({
        sourceLanguage: sourceLanguage.value,
      });

      await debugWindow.start(audioController, () =>
        availableDevices.value.find(d => d.deviceId === selectedDeviceId.value)?.label || '',
      );

      audioController.value.startStreaming((audioData) => {
        window.ipcRenderer.asrSendAudio(audioData);
      });

      textSilenceInterval = setInterval(checkTextSilence, 200);

      setRecordingGuard(true);
      isRecording.value = true;
    } catch (error) {
      cleanupOnError();
      console.error('Failed to start recording:', error);
    } finally {
      isStarting.value = false;
    }
  }

  async function stopRecording() {
    if (isStopping.value) return;
    isStopping.value = true;

    try {
      clearSilenceInterval();

      try { await window.ipcRenderer.asrStop(); } catch { /* already stopped */ }
      try { await debugWindow.stop(); } catch { /* already closed */ }
      endBubble();

      audioController.value?.cleanup();
      audioController.value = null;

      setRecordingGuard(false);
      isRecording.value = false;
    } finally {
      isStopping.value = false;
    }
  }

  function cleanupOnError() {
    clearSilenceInterval();
    debugWindow.stop();
    audioController.value?.cleanup();
    audioController.value = null;
  }

  function clearSilenceInterval() {
    if (textSilenceInterval) {
      clearInterval(textSilenceInterval);
      textSilenceInterval = null;
    }
  }

  // --- Text silence detection ---

  function checkTextSilence() {
    const timeSinceLastText = Date.now() - lastTextTime;
    if (timeSinceLastText > TEXT_SILENCE_TIMEOUT_MS && currentSrc.value) {
      endBubble();
      lastTextTime = Date.now();
    }
  }

  // --- ASR event handlers ---

  function handleASRTranscription(text: string, sentenceEnd: boolean) {
    if (!text) return;
    lastTextTime = Date.now();

    if (sentenceEnd) {
      if (displayTimeout) {
        clearTimeout(displayTimeout);
        displayTimeout = null;
      }
      updateCurrentSrc(text);
      endBubble();
    } else {
      if (displayTimeout) clearTimeout(displayTimeout);
      displayTimeout = setTimeout(() => {
        updateCurrentSrc(text);
        displayTimeout = null;
      }, DISPLAY_DELAY_MS);
    }
  }

  function handleASRError(error: string) {
    console.error('[ASR] Error:', error);
  }

  // --- IPC listener registration ---

  const asrTranscriptionListener = (_: unknown, data: { text?: string; sentence_end?: boolean }) => {
    if (data.text !== undefined) {
      handleASRTranscription(data.text, data.sentence_end ?? false);
    }
  };
  const asrErrorListener = (_: unknown, error: string) => {
    handleASRError(error);
  };

  onMounted(() => {
    setupMicrophone();
    window.ipcRenderer.on('asr:transcription', asrTranscriptionListener);
    window.ipcRenderer.on('asr:error', asrErrorListener);
  });

  onUnmounted(() => {
    if (isRecording.value) {
      stopRecording();
    }
    window.ipcRenderer.off('asr:transcription', asrTranscriptionListener);
    window.ipcRenderer.off('asr:error', asrErrorListener);
    if (displayTimeout) {
      clearTimeout(displayTimeout);
      displayTimeout = null;
    }
  });

  return {
    isRecording,
    availableDevices,
    selectedDeviceId,
    toggleRecording,
  };
}
