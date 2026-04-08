import { ref, onUnmounted } from 'vue';

export interface ConnectivityState {
  online: boolean;
  latencyMs: number;
}

/**
 * Reusable composable for checking Youdao API connectivity via image ping.
 */
export function useConnectivityCheck(pollIntervalMs = 30000) {
  const youdaoOnline = ref(false);
  const latencyMs = ref(0);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function checkYoudao(): Promise<void> {
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        youdaoOnline.value = false;
        latencyMs.value = 0;
        resolve();
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        const elapsed = Math.round(performance.now() - start);
        youdaoOnline.value = elapsed < 5000;
        latencyMs.value = elapsed;
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        youdaoOnline.value = false;
        latencyMs.value = 0;
        resolve();
      };
      img.src = 'https://openapi.youdao.com/favicon.ico?_=' + Date.now() + Math.random();
    });
  }

  function silentPing(cb: () => void) {
    const img = new Image();
    img.onload = cb;
    img.onerror = cb;
    img.src = 'https://openapi.youdao.com/favicon.ico?_=' + Date.now() + Math.random();
  }

  function startPolling() {
    checkYoudao();
    pollTimer = setInterval(checkYoudao, pollIntervalMs);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  onUnmounted(() => {
    stopPolling();
  });

  return { youdaoOnline, latencyMs, checkYoudao, silentPing, startPolling, stopPolling };
}
