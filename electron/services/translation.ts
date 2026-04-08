import crypto from "node:crypto";
import { YOUDAO_APP_KEY, YOUDAO_APP_SECRET } from "./env";
import { logger } from "./logger";

const FETCH_TIMEOUT_MS = 30000;

const langMap: Record<string, string> = {
  中文: "zh-CHS",
  English: "en",
  日本語: "ja",
  한국어: "ko",
  Français: "fr",
  Español: "es",
};

function generateSignature(
  appKey: string,
  input: string,
  salt: string,
  curtime: string,
): string {
  const signStr = appKey + input + salt + curtime + YOUDAO_APP_SECRET;
  return crypto.createHash("sha256").update(signStr).digest("hex");
}

export interface TranslateOptions {
  text: string;
  to: string;
  model?: string;
}

export interface TranslateResult {
  translation?: string;
  error?: string;
}

function buildYoudaoParams(text: string, to: string): URLSearchParams | null {
  const APP_KEY = YOUDAO_APP_KEY;
  const APP_SECRET = YOUDAO_APP_SECRET;

  if (!APP_KEY || !APP_SECRET) {
    return null;
  }

  const salt = Date.now().toString();
  const curtime = Math.floor(Date.now() / 1000).toString();
  const toLang = langMap[to] || "en";

  let input = text;
  if (text.length > 20) {
    input =
      text.substring(0, 10) + text.length + text.substring(text.length - 10);
  }

  const sign = generateSignature(APP_KEY, input, salt, curtime);

  const params = new URLSearchParams();
  params.append("appKey", APP_KEY);
  params.append("salt", salt);
  params.append("curtime", curtime);
  params.append("sign", sign);
  params.append("signType", "v3");
  params.append("from", "auto");
  params.append("to", toLang);

  return params;
}

export async function translateNMT(
  text: string,
  to: string,
): Promise<TranslateResult> {
  const params = buildYoudaoParams(text, to);
  if (!params) {
    return { error: "请配置有道 API 密钥" };
  }
  params.append("q", text);

  try {
    const response = await fetch("https://openapi.youdao.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const data = await response.json();
    if (data.errorCode && data.errorCode !== "0") {
      return { error: data.errorMsg || "翻译失败，错误码: " + data.errorCode };
    }

    return { translation: data.translation?.[0] || "" };
  } catch (error) {
    logger.error("NMT Translation error:", error);
    return { error: "翻译服务出错" };
  }
}

export async function translateLLM(
  text: string,
  to: string,
): Promise<TranslateResult> {

  const params = buildYoudaoParams(text, to);
  if (!params) {
    return { error: "请配置有道 API 密钥" };
  }
  params.append("i", text);
  params.append("streamType", "full");
  params.append("handleOption", "0");

  try {
    const response = await fetch(
      "https://openapi.youdao.com/proxy/http/llm-trans",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "text/event-stream",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return { error: "翻译请求失败" };
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (dataStr && dataStr !== "[DONE]") {
            try {
              const data = JSON.parse(dataStr);
              if (data.code !== "0") {
                reader?.cancel();
                return { error: data.message || "翻译失败" };
              }
              if (data.data?.transFull) {
                result = data.data.transFull;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    if (!result) {
      return { error: "翻译结果为空" };
    }

    return { translation: result };
  } catch (error) {
    logger.error("LLM Translation error:", error);
    return { error: "翻译服务出错" };
  }
}

export async function translate(
  options: TranslateOptions,
): Promise<TranslateResult> {
  const { text, to, model } = options;
  return model === "nmt" ? translateNMT(text, to) : translateLLM(text, to);
}
