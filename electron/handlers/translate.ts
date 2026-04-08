import { ipcMain } from "electron";
import { translate } from "../services/translation";
import { logger } from "../services/logger";

export function registerTranslateHandler(): void {
  ipcMain.handle("translate", async (_event, { text, to, model }: { text: string; to: string; model?: string }) => {
    try {
      if (!text?.trim()) {
        return { error: "请输入要翻译的文本" };
      }
      if (!to) {
        return { error: "请选择目标语言" };
      }
      logger.info(`[Translate] text="${text.slice(0, 30)}" to=${to} model=${model}`);
      const result = await translate({ text, to, model });
      if (result.error) {
        logger.warn(`[Translate] error: ${result.error}`);
      } else {
        logger.info(`[Translate] result="${result.translation?.slice(0, 50)}"`);
      }
      return result;
    } catch (error) {
      logger.error("Translate handler error:", error);
      return { error: "翻译服务出错" };
    }
  });

  logger.info("[IPC] Translate handler registered");
}
