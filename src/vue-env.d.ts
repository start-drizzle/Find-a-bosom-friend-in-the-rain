declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, never>,
    Record<string, never>,
    unknown
  >;
  export default component;
}

declare module "*.css" {
  const content: string;
  export default content;
}

interface Window {
  ipcRenderer: {
    // Event listeners (whitelisted channels only — types from @/types)
    on: (channel: import('@//types').MainToRendererChannel, listener: (...args: any[]) => void) => void;
    off: (channel: import('@/types').MainToRendererChannel, listener: (...args: any[]) => void) => void;
    // Window control methods
    windowMinimize: () => void;
    windowMaximize: () => Promise<boolean>;
    windowClose: () => void;
    windowIsMaximized: () => Promise<boolean>;
    // Translation method
    translate: (
      text: string,
      from: string,
      to: string,
      model?: string,
    ) => Promise<import('@/types').TranslateResult>;
    // Debug window methods
    debugWindowCreate: () => Promise<boolean>;
    debugWindowClose: () => Promise<boolean>;
    debugWindowMinimize: () => Promise<boolean>;
    debugWindowMaximize: () => Promise<boolean>;
    debugWindowIsMaximized: () => Promise<boolean>;
    debugWindowSendAnalyser: (data: unknown) => Promise<boolean>;
    debugWindowIsOpen: () => Promise<boolean>;
    // ASR methods
    asrStart: (opts?: { targetLanguage?: string; sourceLanguage?: string }) => Promise<{ success: boolean; error?: string }>;
    asrStop: () => Promise<{ success: boolean; error?: string }>;
    asrSendAudio: (audioData: ArrayBuffer) => Promise<boolean>;
    // Screenshot methods
    captureScreen: () => Promise<{ success: boolean; data?: string; width?: number; height?: number; error?: string }>;
    getScreenResolution: () => Promise<{ success: boolean; width?: number; height?: number; error?: string }>;
    // YOLO detection method
    yoloDetect: (params: { imageData: string; width: number; height: number }) => Promise<{
      success: boolean;
      count?: number;
      detections?: Array<import('@//types').YoloDetection>;
      error?: string;
    }>;
    // Store YOLO detection coordinates
    storeYoloCoords: (detections: Array<import('@//types').YoloDetection>) => void;
    // Notify main process that translation is complete (for keyboard simulation)
    notifyTranslationComplete: (translatedText: string) => void;
  };
}
