import { BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../services/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const RENDERER_DIST = path.join(process.env.APP_ROOT || "", "dist");
export const PRELOAD_PATH = path.join(__dirname, "preload.mjs");

let win: BrowserWindow | null = null;

export function getWin(): BrowserWindow | null {
  return win;
}

export function createWindow(): BrowserWindow {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: PRELOAD_PATH,
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hidden",
    frame: false,
  });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  win.on("closed", () => {
    win = null;
  });

  // Forward maximize state to renderer so TopAppBar icon stays in sync
  win.on("maximize", () => {
    win?.webContents.send("window-state-changed", true);
  });
  win.on("unmaximize", () => {
    win?.webContents.send("window-state-changed", false);
  });

  logger.info("[Window] BrowserWindow created");
  return win;
}
