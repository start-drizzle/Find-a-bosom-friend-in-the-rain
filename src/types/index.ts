/**
 * Shared type definitions — single source of truth for the entire app.
 *
 * Both renderer (vue-env.d.ts) and preload (electron/preload.ts) reference
 * types from this file. When adding new IPC channels, update HERE first,
 * then sync vue-env.d.ts and preload.ts.
 */

// ────────────────────────────────
// Domain types
// ────────────────────────────────

/** A finalized voice translation bubble */
export interface Bubble {
  id: number
  src: string
  trg: string
}

/** An option in the AI model selector dropdown */
export interface ModelOption {
  value: string
  name: string
  desc: string
}

// ────────────────────────────────
// IPC channel contracts
// ────────────────────────────────

/** All channels that main process can send to renderer */
export const MAIN_TO_RENDERER_CHANNELS = [
  'asr:transcription',
  'asr:status',
  'asr:error',
  'ocr:result',
  'trigger:translate',
  'trigger-capture',
  'yolo:crop-result',
  'debug-analyser-data',
  'window-state-changed',
] as const

export type MainToRendererChannel = (typeof MAIN_TO_RENDERER_CHANNELS)[number]

// ────────────────────────────────
// IPC payload types
// ────────────────────────────────

export interface OcrResultPayload {
  success: boolean
  text: string
  error?: string
}

export interface CropResultPayload {
  success: boolean
  saved: number
  paths: string[]
  error?: string
}

export interface TriggerTranslatePayload {
  text: string
}

export interface YoloDetection {
  class_name: string
  bbox_pixel: { x1: number; y1: number; x2: number; y2: number }
}

export interface TranslateResult {
  translation?: string
  error?: string
}
