import { onUnmounted, type Ref } from 'vue';
import type { AudioController } from '@/utils/audio';

interface UseDebugWindowOptions {
  onWindowClosed: () => void;
}

export function useDebugWindow(options: UseDebugWindowOptions) {
  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let dataInterval: ReturnType<typeof setInterval> | null = null;

  async function start(
    audioController: Ref<AudioController | null>,
    getDeviceLabel: () => string,
  ) {
    await window.ipcRenderer.debugWindowCreate();

    pollInterval = setInterval(async () => {
      const isOpen = await window.ipcRenderer.debugWindowIsOpen();
      if (!isOpen) {
        options.onWindowClosed();
      }
    }, 500);

    dataInterval = setInterval(() => {
      sendAnalyserData(audioController, getDeviceLabel);
    }, 50);
  }

  function sendAnalyserData(
    audioControllerRef: Ref<AudioController | null>,
    getDeviceLabel: () => string,
  ) {
    const controller = audioControllerRef.value;
    if (!controller) return;

    const analyser = controller.analyser;
    const bufferLength = analyser.frequencyBinCount;

    const freqData = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(freqData);

    const waveData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(waveData);

    let freqSum = 0;
    let maxVal = 0;
    let minVal = 255;
    for (let i = 0; i < bufferLength; i++) {
      freqSum += freqData[i];
      if (waveData[i] > maxVal) maxVal = waveData[i];
      if (waveData[i] < minVal) minVal = waveData[i];
    }

    const freqAvg = Math.round(freqSum / bufferLength);
    const deviation = Math.max(Math.abs(maxVal - 128), Math.abs(128 - minVal));

    window.ipcRenderer.debugWindowSendAnalyser({
      freqData: Array.from(freqData),
      waveData: Array.from(waveData),
      freqAvg,
      waveAmp: deviation,
      deviceLabel: getDeviceLabel(),
    });
  }

  async function stop() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    if (dataInterval) {
      clearInterval(dataInterval);
      dataInterval = null;
    }
    try {
      await window.ipcRenderer.debugWindowClose();
    } catch {
      /* already closed */
    }
  }

  onUnmounted(() => {
    stop();
  });

  return { start, stop };
}
