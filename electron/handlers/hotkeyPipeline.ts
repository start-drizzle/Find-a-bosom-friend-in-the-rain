import { ipcMain } from "electron";
import { getWin } from "../core/window";
import { captureAndCrop } from "../services/screenshot";
import { recognizeText } from "../services/ocrService";
import { simulateKeyboardOutput } from "../services/keyboardSim";
import { logger } from "../services/logger";

/**
 * Guard: prevents concurrent Ctrl+P pipeline runs.
 * Covers the full pipeline (OCR → renderer translate → keyboard sim).
 * Reset only when translation + keyboard sim complete, on error, or on timeout.
 */
let isProcessing = false;
const PIPELINE_TIMEOUT_MS = 30000;
let pipelineTimer: ReturnType<typeof setTimeout> | null = null;

function resetProcessing(): void {
  isProcessing = false;
  if (pipelineTimer) {
    clearTimeout(pipelineTimer);
    pipelineTimer = null;
  }
}

/**
 * Ctrl+P pipeline: crop by saved coords → OCR → display text → trigger translate.
 * Translation runs in the renderer; keyboard simulation is triggered on completion.
 */
export async function handleCtrlP(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  // 超时保险：如果渲染进程翻译失败或未回复，自动解锁
  pipelineTimer = setTimeout(() => {
    logger.warn("[Hook] Pipeline timeout — force resetting isProcessing");
    resetProcessing();
  }, PIPELINE_TIMEOUT_MS);

  const win = getWin();
  if (!win || win.isDestroyed()) {
    resetProcessing();
    return;
  }

  try {
    logger.info("[Hook] Ctrl+P triggered — cropping by saved coords");

    const cropResult = await captureAndCrop();
    if (!cropResult.success || !cropResult.images?.length) {
      throw new Error(
        cropResult.error || "没有可用的裁剪区域，请先点击「重新定位区域」",
      );
    }

    logger.info(
      `[Ctrl+P] 裁剪成功，共 ${cropResult.images.length} 个区域`,
    );

    const texts: string[] = [];
    const ocrResults = await Promise.all(
      cropResult.images.map(async (imgBase64) => {
        const imgBuffer = Buffer.from(imgBase64, "base64");
        return recognizeText(imgBuffer);
      }),
    );
    for (const ocrResult of ocrResults) {
      if (ocrResult.success && ocrResult.text) {
        texts.push(ocrResult.text);
      }
    }

    const fullText = texts.join("\n").trim();
    if (!fullText) {
      throw new Error("OCR 识别失败，未检测到文字");
    }

    logger.info(`[OCR] 识别完成: ${fullText.slice(0, 50)}...`);

    // 注意：isProcessing 不在此处重置。
    // 等渲染进程翻译完成 → translation:complete → 键盘模拟完成后再重置。
    win.webContents.send("ocr:result", { success: true, text: fullText });
    win.webContents.send("trigger:translate", { text: fullText });
  } catch (error) {
    logger.error("[Ctrl+P] Error:", error);
    resetProcessing();
    if (!win.isDestroyed()) {
      win.webContents.send("yolo:crop-result", {
        success: false,
        saved: 0,
        paths: [],
        error: error instanceof Error ? error.message : "截图/识别失败",
      });
    }
  }
}

/**
 * Register the translation:complete IPC listener for keyboard simulation.
 */
export function registerTranslationCompleteListener(): void {
  ipcMain.on("translation:complete", async (_event, translatedText: string) => {
    logger.info(
      "[Hook] 翻译完成，开始键盘输入:",
      translatedText.slice(0, 50),
    );
    await simulateKeyboardOutput(translatedText);
    resetProcessing();
  });
}
