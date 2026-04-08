/**
 * OCR Service — HTTP client for ConvNextViT text recognition
 * 将裁剪后的文本行图片发送到服务器，返回识别文字
 */

import FormData from "form-data";
import fetch from "node-fetch";
import { REMOTE_API_KEY, REMOTE_API_BASE_URL } from "./env";
import { logger } from "./logger";

/**
 * OCR 服务器配置（与 YOLO 共用同一服务器）
 */
const OCR_CONFIG = {
  baseURL: REMOTE_API_BASE_URL,
  endpoint: "/ocr",
  apiKey: REMOTE_API_KEY,
  timeout: 30000,
};

/**
 * OCR 识别结果
 */
export interface OCRResult {
  success: boolean;
  /** 识别出的文本 */
  text: string;
  /** 推理耗时 (ms) */
  time_ms?: number;
  error?: string;
}

/**
 * 发送图片到 OCR 服务器进行文字识别
 *
 * @param imageData - 图片 Buffer
 * @param mimeType - 图片 MIME 类型
 * @returns 识别结果
 */
export async function recognizeText(
  imageData: Buffer,
  mimeType: string = "image/png",
): Promise<OCRResult> {
  try {
    const formData = new FormData();
    formData.append("file", imageData, {
      filename: "crop.png",
      contentType: mimeType,
    });

    const response = await fetch(`${OCR_CONFIG.baseURL}${OCR_CONFIG.endpoint}`, {
      method: "POST",
      headers: {
        "X-API-Key": OCR_CONFIG.apiKey,
        ...formData.getHeaders(),
      },
      body: formData,
      signal: AbortSignal.timeout(OCR_CONFIG.timeout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as { error?: string }).error || `HTTP ${response.status}`);
    }

    return (await response.json()) as OCRResult;
  } catch (error) {
    logger.error("[OCR] Recognize error:", error);
    return {
      success: false,
      text: "",
      error: error instanceof Error ? error.message : "OCR 服务出错",
    };
  }
}
