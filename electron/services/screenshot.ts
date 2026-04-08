/**
 * Screen Capture Service
 * 屏幕截图服务
 */

import { desktopCapturer, screen } from "electron";

export interface ScreenshotResult {
  /** 截图 PNG 数据 (Base64) */
  data: string;
  /** 截图原始宽度（物理像素） */
  width: number;
  /** 截图原始高度（物理像素） */
  height: number;
}

/**
 * 获取主显示器的真实物理分辨率
 * Windows 系统可能有显示缩放，需用逻辑分辨率 × 缩放因子
 */
export function getRealScreenResolution(): { width: number; height: number } {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: logicalWidth, height: logicalHeight } = primaryDisplay.size;
  const scaleFactor = primaryDisplay.scaleFactor;

  return {
    width: Math.round(logicalWidth * scaleFactor),
    height: Math.round(logicalHeight * scaleFactor),
  };
}

/**
 * 捕获主屏幕截图
 */
export async function captureScreen(): Promise<ScreenshotResult> {
  const { width: realWidth, height: realHeight } = getRealScreenResolution();

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: realWidth, height: realHeight },
  });

  if (sources.length === 0) {
    throw new Error("未找到屏幕源");
  }

  const pngBuffer = sources[0].thumbnail.toPNG();

  return {
    data: pngBuffer.toString("base64"),
    width: realWidth,
    height: realHeight,
  };
}

// ── YOLO 检测坐标存储 & 按坐标裁剪 ─────────────────────

interface DetectionCoords {
  class_name: string;
  bbox_pixel: { x1: number; y1: number; x2: number; y2: number };
}

let storedDetections: DetectionCoords[] = [];

export function storeDetections(detections: DetectionCoords[]): void {
  storedDetections = detections;
}

/**
 * 按存储的检测坐标截取屏幕并裁剪
 * 返回裁剪图片的 base64 数据，供后续 OCR 使用
 */
export async function captureAndCrop(): Promise<{
  success: boolean;
  saved: number;
  images: string[];
  error?: string;
}> {
  if (storedDetections.length === 0) {
    return { success: false, saved: 0, images: [], error: "没有可用的检测坐标，请先执行识别" };
  }

  const { width: realWidth, height: realHeight } = getRealScreenResolution();
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: realWidth, height: realHeight },
  });

  if (sources.length === 0) {
    return { success: false, saved: 0, images: [], error: "未找到屏幕源" };
  }

  const thumbnail = sources[0].thumbnail;
  const images: string[] = [];

  for (const det of storedDetections) {
    const { x1, y1, x2, y2 } = det.bbox_pixel;
    const w = x2 - x1;
    const h = y2 - y1;

    if (w <= 0 || h <= 0) continue;

    const cropped = thumbnail.crop({ x: x1, y: y1, width: w, height: h });
    const pngData = cropped.toPNG();
    images.push(pngData.toString("base64"));
  }

  return { success: true, saved: images.length, images };
}
