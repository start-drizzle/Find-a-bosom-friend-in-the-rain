import { ipcMain } from "electron";
import { getWin } from "../core/window";
import { logger } from "../services/logger";

export function registerWindowHandlers(): void {
  ipcMain.on("window-minimize", () => {
    getWin()?.minimize();
  });

  ipcMain.handle("window-maximize", () => {
    const win = getWin();
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return win.isMaximized();
  });

  ipcMain.on("window-close", () => {
    getWin()?.close();
  });

  ipcMain.handle("window-is-maximized", () => {
    return getWin()?.isMaximized() ?? false;
  });

  logger.info("[IPC] Window handlers registered");
}
