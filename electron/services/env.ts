import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { logger } from "./logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findEnvFile(): { content: string; path: string } | null {
  const candidates = [
    // Packaged: next to main.js in dist-electron/
    path.join(__dirname, "..", ".env.local"),
    // Dev: project root
    path.join(__dirname, "..", "..", ".env.local"),
  ];

  try {
    const appPath = app.getAppPath();
    if (appPath) {
      candidates.push(path.join(appPath, "dist-electron", ".env.local"));
      candidates.push(path.join(appPath, ".env.local"));
    }
  } catch {
    // app not ready yet
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf-8");
        return { content, path: candidate };
      }
    } catch {
      // continue
    }
  }
  return null;
}

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const found = findEnvFile();
const envVars = found ? parseEnv(found.content) : {};

export const YOUDAO_APP_KEY = envVars["VITE_YOUDAO_APP_KEY"] || "";
export const YOUDAO_APP_SECRET = envVars["VITE_YOUDAO_APP_SECRET"] || "";

export const DASHSCOPE_API_KEY = envVars["DASHSCOPE_API_KEY"] || "";
export const DASHSCOPE_WS_URL = envVars["DASHSCOPE_WS_URL"] || "wss://dashscope.aliyuncs.com/api-ws/v1/inference";
export const AUDIO_SAMPLE_RATE = parseInt(envVars["AUDIO_SAMPLE_RATE"] || "16000", 10);

export const REMOTE_API_KEY = envVars["REMOTE_API_KEY"] || "";

/** Remote inference server base URL (YOLO + OCR) */
export const REMOTE_API_BASE_URL = "https://startdrizzling.cn/api";

export function loadEnvVars(): void {
  if (found) {
    logger.info("[Env] Loaded from:", found.path);
  } else {
    logger.warn("[Env] .env.local not found");
  }
  logger.info("[Env] Youdao APP_KEY:", YOUDAO_APP_KEY ? "set" : "EMPTY");
  logger.info("[Env] Youdao APP_SECRET:", YOUDAO_APP_SECRET ? "set" : "EMPTY");
  logger.info("[Env] DashScope API_KEY:", DASHSCOPE_API_KEY ? "set" : "EMPTY");
  logger.info("[Env] REMOTE_API_KEY:", REMOTE_API_KEY ? "set" : "EMPTY");
}
