import { ref, onUnmounted } from 'vue';

export interface UseAudioCanvasOptions {
  volumeThreshold?: number;
}

/**
 * Shared composable for audio canvas visualization.
 *
 * Manages the requestAnimationFrame loop and computes audio metrics
 * (volume, amplitude, sound detection) from frequency and waveform data.
 * Each consumer handles its own canvas rendering and calls computeMetrics()
 * after drawing.
 */
export function useAudioCanvas(options: UseAudioCanvasOptions = {}) {
  const { volumeThreshold = 10 } = options;

  const isSoundDetected = ref(false);
  const freqVolume = ref(0);
  const waveAmplitude = ref(0);

  let animFrameId: number | null = null;

  function startAnimation(drawFn: () => void) {
    if (animFrameId) return;
    function loop() {
      drawFn();
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
  }

  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function resetMetrics() {
    isSoundDetected.value = false;
    freqVolume.value = 0;
    waveAmplitude.value = 0;
  }

  /**
   * Compute audio metrics from raw frequency and waveform data.
   * Updates isSoundDetected, freqVolume, and waveAmplitude refs.
   */
  function computeMetrics(freqData: Uint8Array, waveData: Uint8Array, barCount: number) {
    const freqStep = Math.floor(freqData.length / barCount);
    let freqSum = 0;
    for (let i = 0; i < barCount; i++) {
      freqSum += freqData[i * freqStep];
    }
    freqVolume.value = Math.round(freqSum / barCount);

    let minVal = 255;
    let maxVal = 0;
    for (let i = 0; i < waveData.length; i++) {
      if (waveData[i] < minVal) minVal = waveData[i];
      if (waveData[i] > maxVal) maxVal = waveData[i];
    }

    const deviation = Math.max(Math.abs(maxVal - 128), Math.abs(128 - minVal));
    waveAmplitude.value = deviation;
    isSoundDetected.value = freqVolume.value > volumeThreshold || deviation > 5;
  }

  onUnmounted(() => {
    stopAnimation();
  });

  return {
    isSoundDetected,
    freqVolume,
    waveAmplitude,
    startAnimation,
    stopAnimation,
    resetMetrics,
    computeMetrics,
  };
}
