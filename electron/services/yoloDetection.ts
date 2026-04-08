/**
 * YOLO Detection Service
 * YOLO 目标检测服务
 */

import FormData from "form-data";
import fetch from "node-fetch";
import { REMOTE_API_KEY, REMOTE_API_BASE_URL } from "./env";
import { logger } from "./logger";

/**
 * YOLO 服务器配置
 */
const YOLO_CONFIG = {
  baseURL: REMOTE_API_BASE_URL,
  apiEndpoint: "/detect",
  apiKey: REMOTE_API_KEY,
  timeout: 30000, // 30 秒
};

/**
 * 检测框数据
 */
export interface BBox {
  x1: number; // 归一化坐标 0-1
  y1: number;
  x2: number;
  y2: number;
}

export interface BBoxPixel {
  x1: number; // 像素坐标
  y1: number;
  x2: number;
  y2: number;
}

/**
 * 单个检测结果
 */
export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: BBox;
  bbox_pixel: BBoxPixel;
}

/**
 * YOLO 检测结果
 */
export interface YOLODetectionResult {
  success: boolean;
  image_width: number;
  image_height: number;
  detections: Detection[];
  count: number;
  inference_time_ms: number;
  error?: string;
}

/**
 * 上传图片进行目标检测
 *
 * @param imageData - 图片数据 (Buffer)
 * @param mimeType - 图片 MIME 类型 (默认 image/jpeg)
 * @returns 检测结果
 */
export async function detectObjects(
  imageData: Buffer,
  mimeType: string = "image/jpeg",
): Promise<YOLODetectionResult> {
  try {
    // 创建表单数据
    const formData = new FormData();
    formData.append("file", imageData, {
      filename: "capture.jpg",
      contentType: mimeType,
    });

    // 发送请求
    const response = await fetch(
      `${YOLO_CONFIG.baseURL}${YOLO_CONFIG.apiEndpoint}`,
      {
        method: "POST",
        headers: {
          "X-API-Key": YOLO_CONFIG.apiKey,
          ...formData.getHeaders(),
        },
        body: formData,
        signal: AbortSignal.timeout(YOLO_CONFIG.timeout),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || `HTTP ${response.status}`);
    }

    const result: YOLODetectionResult = (await response.json()) as YOLODetectionResult;

    // 验证响应格式
    if (typeof result.success !== "boolean") {
      throw new Error("Invalid response format");
    }

    return result;
  } catch (error) {
    logger.error("[YOLO] Detect objects error:", error);
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
}

/**
 * 将 Base64 图片数据转换为 Buffer
 *
 * @param base64Data - Base64 编码的图片数据（不含 data:image/...;base64, 前缀）
 * @returns 图片 Buffer
 */
export function base64ToBuffer(base64Data: string): Buffer {
  return Buffer.from(base64Data, "base64");
}
