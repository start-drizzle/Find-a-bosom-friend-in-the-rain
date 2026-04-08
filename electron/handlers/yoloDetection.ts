/**
 * YOLO Detection IPC Handler
 * YOLO 检测 IPC 处理器
 */

import { ipcMain } from "electron";
import { detectObjects, base64ToBuffer } from "../services/yoloDetection";
import { logger } from "../services/logger";

/**
 * 注册 YOLO 检测相关的 IPC 处理器
 */
export function registerYoloDetectionHandler(): void {
  /**
   * 执行目标检测
   * Channel: yolo:detect
   *
   * Args:
   *   imageData: Base64 编码的图片数据
   *   width: 图片宽度
   *   height: 图片高度
   */
  ipcMain.handle("yolo:detect", async (_event, { imageData, width, height }) => {
    try {
      // 将 Base64 转换为 Buffer
      const imageBuffer = base64ToBuffer(imageData);

      // 发送到服务器进行检测
      const result = await detectObjects(imageBuffer, "image/jpeg");

      // 验证服务器返回的图片尺寸是否一致
      if (result.success && (result.image_width !== width || result.image_height !== height)) {
        logger.warn(
          `[YOLO] Image size mismatch: sent ${width}x${height}, received ${result.image_width}x${result.image_height}`,
        );
      }

      return result;
    } catch (error) {
      logger.error("[IPC] YOLO detection error:", error);
      return {
        success: false,
        image_width: 0,
        image_height: 0,
        detections: [],
        count: 0,
        inference_time_ms: 0,
        error: error instanceof Error ? error.message : "检测服务出错",
      };
    }
  });

  logger.info("[IPC] YOLO detection handler registered");
}
