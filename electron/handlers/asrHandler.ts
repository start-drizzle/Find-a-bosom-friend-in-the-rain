import { ipcMain } from "electron";
import { ASRService } from "../services/asrService";
import { getWin } from "../core/window";
import { logger } from "../services/logger";

let asrService: ASRService | null = null;

export function registerASRHandler(): void {
  asrService = new ASRService();

  // Forward ASR events to renderer (use getWin() for fresh reference)
  asrService.on("transcription", (data) => {
    const win = getWin();
    win?.webContents.send("asr:transcription", data);
  });

  asrService.on("status", (data) => {
    const win = getWin();
    win?.webContents.send("asr:status", data);
  });

  asrService.on("error", (error) => {
    const win = getWin();
    win?.webContents.send("asr:error", error);
  });

  // IPC handlers
  ipcMain.handle("asr:start", async (_, options: { sourceLanguage?: string }) => {
    try {
      logger.info("[ASR] Starting recognition", options);
      await asrService?.startRecognition(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("asr:stop", async () => {
    try {
      logger.info("[ASR] Stopping recognition");
      await asrService?.stopRecognition();
      return { success: true };
    } catch (error) {
      logger.error("[ASR] Stop error:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle("asr:send-audio", async (_, audioData: ArrayBuffer) => {
    if (asrService) {
      asrService.sendAudioData(Buffer.from(audioData));
    }
    return true;
  });

  logger.info("[IPC] ASR handler registered");
}
