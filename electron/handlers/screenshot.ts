/**
 * Screen Capture IPC Handler
 * 截图 IPC 处理器
 */

import { ipcMain } from "electron";
import {
  captureScreen,
  getRealScreenResolution,
  storeDetections,
} from "../services/screenshot";
import { logger } from "../services/logger";

interface DetectionInput {
  class_name?: string;
  bbox_pixel: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * 注册截图相关的 IPC 处理器
 */
export function registerScreenshotHandler(): void {
  /**
   * 捕获屏幕截图
   * Channel: capture-screen
   */
  ipcMain.handle("capture-screen", async () => {
    try {
      const result = await captureScreen();
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      logger.error("[IPC] Capture screen error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "截图失败",
      };
    }
  });

  /**
   * 获取屏幕真实分辨率
   * Channel: get-screen-resolution
   */
  ipcMain.handle("get-screen-resolution", () => {
    try {
      const resolution = getRealScreenResolution();
      return {
        success: true,
        ...resolution,
      };
    } catch (error) {
      logger.error("[IPC] Get screen resolution error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取分辨率失败",
      };
    }
  });

  /**
   * 存储 YOLO 检测坐标（供后续 Ctrl+P 裁剪使用）
   * Channel: yolo:store-coords
   */
  ipcMain.on("yolo:store-coords", (_event, detections: DetectionInput[]) => {
    try {
      storeDetections(
        detections.map((d) => ({
          class_name: d.class_name ?? "object",
          bbox_pixel: d.bbox_pixel,
        })),
      );
    } catch (error) {
      logger.error("[IPC] Store coords error:", error);
    }
  });

  logger.info("[IPC] Screenshot handler registered");
}
