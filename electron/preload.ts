import { contextBridge, ipcRenderer } from "electron";

/** Channel list — single source of truth (mirrors @/types MAIN_TO_RENDERER_CHANNELS) */
const ALLOWED_CHANNELS: readonly string[] = [
  'asr:transcription', 'asr:status', 'asr:error',
  'ocr:result', 'trigger:translate', 'trigger-capture',
  'yolo:crop-result', 'debug-analyser-data',
  'window-state-changed',
];

type AllowedChannel = (typeof ALLOWED_CHANNELS)[number];

// --------- Named IPC API — whitelist-only approach ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  // Event listener methods (scoped to allowed channels)
  on(channel: AllowedChannel, listener: (...args: any[]) => void) {
    if (!ALLOWED_CHANNELS.includes(channel)) return;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(channel: AllowedChannel, listener: (...args: any[]) => void) {
    if (!ALLOWED_CHANNELS.includes(channel)) return;
    return ipcRenderer.off(channel, listener);
  },

  // Window control methods
  windowMinimize: () => ipcRenderer.send("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.send("window-close"),
  windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Translation method
  translate: (text: string, from: string, to: string, model?: string) =>
    ipcRenderer.invoke("translate", { text, from, to, model }),

  // Debug window methods
  debugWindowCreate: () => ipcRenderer.invoke("debug-window-create"),
  debugWindowClose: () => ipcRenderer.invoke("debug-window-close"),
  debugWindowMinimize: () => ipcRenderer.invoke("debug-window-minimize"),
  debugWindowMaximize: () => ipcRenderer.invoke("debug-window-maximize"),
  debugWindowIsMaximized: () => ipcRenderer.invoke("debug-window-is-maximized"),
  debugWindowSendAnalyser: (data: unknown) =>
    ipcRenderer.invoke("debug-window-send-analyser", data),
  debugWindowIsOpen: () => ipcRenderer.invoke("debug-window-is-open"),

  // ASR (speech recognition) methods
  asrStart: (opts?: { targetLanguage?: string; sourceLanguage?: string }) =>
    ipcRenderer.invoke("asr:start", opts),
  asrStop: () => ipcRenderer.invoke("asr:stop"),
  asrSendAudio: (audioData: ArrayBuffer) =>
    ipcRenderer.invoke("asr:send-audio", audioData),

  // Screenshot methods
  captureScreen: () => ipcRenderer.invoke("capture-screen"),
  getScreenResolution: () => ipcRenderer.invoke("get-screen-resolution"),

  // YOLO detection method
  yoloDetect: (params: { imageData: string; width: number; height: number }) =>
    ipcRenderer.invoke("yolo:detect", params),

  // Store YOLO detection coordinates
  storeYoloCoords: (detections: Array<{ class_name: string; bbox_pixel: { x1: number; y1: number; x2: number; y2: number } }>) =>
    ipcRenderer.send("yolo:store-coords", detections),

  // Notify main process that translation is complete
  notifyTranslationComplete: (translatedText: string) =>
    ipcRenderer.send("translation:complete", translatedText),
});
