<template>
  <div
    class="fixed inset-0 flex flex-col bg-gradient-to-br from-sky-50/90 to-blue-100/60 backdrop-blur-xl text-slate-700 select-none"
    style="-webkit-app-region: drag;"
  >
    <!-- Custom Title Bar -->
    <div class="flex items-center justify-between px-4 py-3 bg-white/30 border-b border-blue-200/50">
      <span class="text-[11px] font-bold text-blue-500 tracking-widest uppercase">Audio Monitor</span>
      <div class="flex items-center gap-1" style="-webkit-app-region: no-drag;">
        <button
          @click="minimizeWindow"
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-200/60 text-slate-400 hover:text-slate-600 transition-all duration-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
        <button
          @click="closeWindow"
          class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-400/80 text-slate-400 hover:text-white transition-all duration-300"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 flex flex-col gap-3">
      <!-- Frequency Bars -->
      <div class="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/80 shadow-sm shadow-blue-100/50 p-3">
        <div class="text-[10px] text-slate-400 mb-2 font-medium tracking-wide">Frequency Spectrum</div>
        <canvas ref="freqCanvasRef" width="368" height="56" class="w-full rounded-lg" />
      </div>

      <!-- Waveform -->
      <div class="rounded-2xl bg-white/50 backdrop-blur-sm border border-white/80 shadow-sm shadow-blue-100/50 p-3">
        <div class="text-[10px] text-slate-400 mb-2 font-medium tracking-wide">Waveform</div>
        <canvas ref="waveCanvasRef" width="368" height="40" class="w-full rounded-lg" />
      </div>

      <!-- Status Bar -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2.5">
          <div
            class="w-2.5 h-2.5 rounded-full transition-all duration-500"
            :class="isSoundDetected ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.7)] animate-pulse' : 'bg-slate-300'"
          />
          <span class="text-[12px] font-medium" :class="isSoundDetected ? 'text-blue-500' : 'text-slate-400'">
            {{ isSoundDetected ? 'Sound detected' : 'Listening...' }}
          </span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[11px] text-slate-400 font-mono">
            Vol: <span class="text-blue-400">{{ freqVolume }}</span>
          </span>
        </div>
      </div>

      <!-- Device Info -->
      <div class="mt-auto pt-2 text-[10px] text-slate-400/70 font-mono truncate border-t border-slate-200/50">
        {{ deviceLabel || 'No device selected' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAudioCanvas } from '@/composables/useAudioCanvas';

const freqCanvasRef = ref<HTMLCanvasElement | null>(null);
const waveCanvasRef = ref<HTMLCanvasElement | null>(null);
const { isSoundDetected, freqVolume, startAnimation, stopAnimation, computeMetrics } = useAudioCanvas();

const deviceLabel = ref('');

let analyserData: { freqData: Uint8Array; waveData: Uint8Array; freqAvg: number; waveAmp: number; deviceLabel?: string } | null = null;

function draw() {
  if (!freqCanvasRef.value || !waveCanvasRef.value) return;

  const freqCanvas = freqCanvasRef.value;
  const waveCanvas = waveCanvasRef.value;
  const freqCtx = freqCanvas.getContext('2d');
  const waveCtx = waveCanvas.getContext('2d');
  if (!freqCtx || !waveCtx) return;

  freqCtx.clearRect(0, 0, freqCanvas.width, freqCanvas.height);
  waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

  if (!analyserData) return;

  const { freqData, waveData } = analyserData;
  const bufferLength = freqData.length;
  const barCount = 32;

  // Draw frequency bars
  const barWidth = (freqCanvas.width - (barCount - 1) * 2) / barCount;
  const freqStep = Math.floor(bufferLength / barCount);

  for (let i = 0; i < barCount; i++) {
    const value = freqData[i * freqStep];
    const barHeight = Math.max(3, (value / 255) * freqCanvas.height);
    const alpha = 0.5 + (value / 255) * 0.5;
    const lightness = 50 + (value / 255) * 20;
    freqCtx.fillStyle = `hsla(212, 80%, ${lightness}%, ${alpha})`;
    const x = i * (barWidth + 2);
    const y = freqCanvas.height - barHeight;

    freqCtx.beginPath();
    freqCtx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
    freqCtx.fill();

    if (value > 180) {
      freqCtx.shadowColor = 'rgba(96, 165, 250, 0.8)';
      freqCtx.shadowBlur = 10;
      freqCtx.fill();
      freqCtx.shadowBlur = 0;
    }
  }

  // Draw waveform
  const waveStep = Math.floor(waveCanvas.width / bufferLength);
  waveCtx.lineWidth = 2;
  waveCtx.strokeStyle = '#60a5fa';
  waveCtx.lineCap = 'round';
  waveCtx.lineJoin = 'round';
  waveCtx.beginPath();

  for (let i = 0; i < bufferLength; i++) {
    const v = waveData[i] / 128.0;
    const x = i * waveStep;
    const y = (v * waveCanvas.height) / 2;
    if (i === 0) waveCtx.moveTo(x, y);
    else waveCtx.lineTo(x, y);
  }
  waveCtx.stroke();

  if (isSoundDetected.value) {
    waveCtx.shadowColor = 'rgba(96, 165, 250, 0.6)';
    waveCtx.shadowBlur = 6;
    waveCtx.stroke();
    waveCtx.shadowBlur = 0;
  }

  computeMetrics(freqData, waveData, barCount);
}

function minimizeWindow() {
  window.ipcRenderer?.debugWindowMinimize();
}

function closeWindow() {
  window.ipcRenderer?.debugWindowClose();
}

function handleAnalyserData(_event: unknown, data: typeof analyserData) {
  analyserData = data;
  if (data) {
    deviceLabel.value = data.deviceLabel || '';
  }
}

onMounted(() => {
  startAnimation(draw);
  window.ipcRenderer.on('debug-analyser-data', handleAnalyserData);
});

onUnmounted(() => {
  stopAnimation();
  window.ipcRenderer.off('debug-analyser-data', handleAnalyserData);
});
</script>
