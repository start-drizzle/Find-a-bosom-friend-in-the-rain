import { ipcMain, BrowserWindow } from "electron";
import path from "node:path";
import { VITE_DEV_SERVER_URL, RENDERER_DIST, PRELOAD_PATH } from "../core/window";

let debugWindow: BrowserWindow | null = null;

export function registerDebugWindowHandler(): void {
  ipcMain.handle('debug-window-create', () => {
    if (debugWindow && !debugWindow.isDestroyed()) {
      debugWindow.focus();
      return true;
    }

    debugWindow = new BrowserWindow({
      width: 420,
      height: 340,
      resizable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      fullscreenable: false,
      alwaysOnTop: true,
      frame: false,
      titleBarStyle: 'hidden',
      title: 'Audio Monitor - Drizzle',
      backgroundColor: '#f0f9ff',
      webPreferences: {
        preload: PRELOAD_PATH,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (VITE_DEV_SERVER_URL) {
      debugWindow.loadURL(`${VITE_DEV_SERVER_URL}#/debug-window`);
    } else {
      debugWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {
        hash: '/debug-window',
      });
    }

    debugWindow.on('closed', () => {
      debugWindow = null;
    });

    return true;
  });

  ipcMain.handle('debug-window-close', () => {
    if (debugWindow && !debugWindow.isDestroyed()) {
      debugWindow.close();
      debugWindow = null;
    }
    return true;
  });

  ipcMain.handle('debug-window-minimize', () => {
    if (debugWindow && !debugWindow.isDestroyed()) {
      debugWindow.minimize();
    }
    return true;
  });

  ipcMain.handle('debug-window-maximize', () => {
    if (!debugWindow || debugWindow.isDestroyed()) return true;
    if (debugWindow.isMaximized()) {
      debugWindow.unmaximize();
    } else {
      debugWindow.maximize();
    }
    return true;
  });

  ipcMain.handle('debug-window-is-maximized', () => {
    return debugWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('debug-window-send-analyser', (_event, data) => {
    if (debugWindow && !debugWindow.isDestroyed()) {
      debugWindow.webContents.send('debug-analyser-data', data);
    }
    return true;
  });

  ipcMain.handle('debug-window-is-open', () => {
    return debugWindow !== null && !debugWindow.isDestroyed();
  });
}
