import { app, BrowserWindow, globalShortcut } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uIOhook, UiohookKey } from "uiohook-napi";

// Environment setup
import { loadEnvVars } from "./services/env";
import { logger } from "./services/logger";

// Window creation
import { createWindow, getWin } from "./core/window";

// IPC handlers
import { registerIpcHandlers } from "./core/ipc";

// Hotkey pipeline (Ctrl+P OCR-translate flow)
import { handleCtrlP, registerTranslationCompleteListener } from "./handlers/hotkeyPipeline";

// Set app root for build output paths
process.env.APP_ROOT = path.dirname(fileURLToPath(import.meta.url));

// Initialize environment variables
loadEnvVars();

// App lifecycle
app.whenReady().then(() => {
  // Create the main window
  createWindow();

  // Register IPC handlers
  registerIpcHandlers();

  // Register translation complete listener for keyboard simulation
  registerTranslationCompleteListener();

  // 底层键盘钩子：比 globalShortcut 更优先，游戏全屏中也能响应
  uIOhook.on("keydown", (e) => {
    if (e.ctrlKey && e.keycode === UiohookKey.P) {
      handleCtrlP();
    } else if (e.ctrlKey && e.keycode === UiohookKey.L) {
      logger.info("[Hook] Ctrl+L triggered — 重新定位区域");
      const win = getWin();
      if (win && !win.isDestroyed()) {
        win.webContents.send("trigger-capture", {});
      }
    }
  });
  uIOhook.start();

  // 注册空操作的 globalShortcut 拦截 Ctrl+P，防止触发浏览器打印对话框
  globalShortcut.register("CommandOrControl+P", () => {});

  logger.info("[Hook] uIOhook 已启动 — Ctrl+P 低级键盘钩子已注册");
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Re-create window on macOS when dock icon is clicked
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Cleanup on quit
app.on("will-quit", () => {
  uIOhook.stop();
  globalShortcut.unregisterAll();
});
