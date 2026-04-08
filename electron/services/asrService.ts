import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import {
  DASHSCOPE_API_KEY,
  DASHSCOPE_WS_URL,
  AUDIO_SAMPLE_RATE,
} from "./env";
import { logger } from "./logger";

// Fun-ASR WebSocket message types
interface WSMessageHeader {
  action?: "run-task" | "finish-task";
  event?:
    | "task-started"
    | "result-generated"
    | "task-finished"
    | "task-failed";
  task_id: string;
  streaming: "duplex";
  error_code?: string;
  error_message?: string;
  attributes?: Record<string, unknown>;
}

interface SentenceResult {
  begin_time: number;
  end_time: number | null;
  text: string;
  heartbeat: boolean | null;
  sentence_end: boolean;
  words?: {
    begin_time: number;
    end_time: number;
    text: string;
    punctuation: string;
  }[];
}

interface FunASROutput {
  sentence?: SentenceResult;
}

interface FunASRMessagePayload {
  task_group?: "audio";
  task?: "asr";
  function?: "recognition";
  model?: string;
  parameters?: {
    sample_rate: number;
    format: string;
    language_hints?: string[];
    semantic_punctuation_enabled?: boolean;
    max_sentence_silence?: number;
    disfluency_removal_enabled?: boolean;
  };
  input?: Record<string, unknown>;
  output?: FunASROutput;
  usage?: {
    duration: number;
  };
}

interface FunASRMessage {
  header: WSMessageHeader;
  payload: FunASRMessagePayload;
}

export class ASRService extends EventEmitter {
  private ws: WebSocket | null = null;
  private taskId = "";
  private isTaskStarted = false;
  private languageHint: string | null = null;

  constructor() {
    super();
  }

  /**
   * Start recognition: connect WebSocket and send run-task
   */
  async startRecognition(options: {
    sourceLanguage?: string;
  } = {}): Promise<void> {
    if (this.ws) {
      await this.stopRecognition();
    }

    if (!DASHSCOPE_API_KEY) {
      throw new Error("DASHSCOPE_API_KEY is not configured");
    }

    // Fun-ASR only supports: zh, en, ja. auto = no hint (let model auto-detect)
    this.languageHint = options.sourceLanguage && options.sourceLanguage !== 'auto'
      ? options.sourceLanguage
      : null;

    this.taskId = uuidv4().replace(/-/g, "");
    await this.connectWebSocket();
    this.sendRunTask();
  }

  /**
   * Send audio data to the WebSocket
   */
  sendAudioData(buffer: Buffer): void {
    if (!this.ws || !this.isTaskStarted) return;
    try {
      this.ws.send(buffer);
    } catch (err) {
      logger.error("[ASR] sendAudioData error:", err);
    }
  }

  /**
   * Stop recognition: send finish-task and close
   */
  async stopRecognition(): Promise<void> {
    if (this.isTaskStarted) {
      try {
        this.sendFinishTask();
      } catch {
        // ignore
      }
      this.isTaskStarted = false;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.emit("status", { status: "idle" });
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Capture in local variable so close handler only acts on THIS instance.
      // Prevents a stale close handler from nulling out a new WebSocket
      // created by a subsequent startRecognition() call.
      const ws = new WebSocket(DASHSCOPE_WS_URL, {
        headers: {
          Authorization: `bearer ${DASHSCOPE_API_KEY}`,
          "User-Agent": "Electron-Translation-App/1.0",
        },
      });
      this.ws = ws;

      ws.on("open", () => {
        logger.info("[ASR] WebSocket connected");
        resolve();
      });

      ws.on("message", (data: Buffer) => {
        this.handleServerMessage(data.toString());
      });

      ws.on("error", (error) => {
        logger.error("[ASR] WebSocket error:", error.message);
        this.emit("error", `WebSocket错误: ${error.message}`);
        reject(error);
      });

      ws.on("close", () => {
        logger.info("[ASR] WebSocket closed");
        if (this.ws === ws) {
          this.ws = null;
          this.isTaskStarted = false;
          this.emit("status", { status: "idle" });
        }
      });
    });
  }

  private sendRunTask(): void {
    if (!this.ws) throw new Error("WebSocket not connected");

    const parameters: FunASRMessagePayload["parameters"] = {
      sample_rate: AUDIO_SAMPLE_RATE,
      format: "pcm",
      semantic_punctuation_enabled: false,
      max_sentence_silence: 1300,
    };

    // Only add language_hints if a specific language is selected (not 'auto')
    if (this.languageHint) {
      parameters.language_hints = [this.languageHint];
    }

    const runTaskMsg: FunASRMessage = {
      header: {
        action: "run-task",
        task_id: this.taskId,
        streaming: "duplex",
      },
      payload: {
        task_group: "audio",
        task: "asr",
        function: "recognition",
        model: "fun-asr-realtime",
        parameters,
        input: {},
      },
    };

    this.ws.send(JSON.stringify(runTaskMsg));
    logger.info("[ASR] run-task sent (fun-asr-realtime)", this.languageHint ? `language_hints: [${this.languageHint}]` : "(auto-detect)");
  }

  private sendFinishTask(): void {
    if (!this.ws || !this.isTaskStarted) return;

    const finishTaskMsg: FunASRMessage = {
      header: {
        action: "finish-task",
        task_id: this.taskId,
        streaming: "duplex",
      },
      payload: {
        input: {},
      },
    };

    this.ws.send(JSON.stringify(finishTaskMsg));
    logger.info("[ASR] finish-task sent");
  }

  private handleServerMessage(data: string): void {
    try {
      const message: FunASRMessage = JSON.parse(data);
      const event = message.header.event;

      switch (event) {
        case "task-started":
          logger.info("[ASR] task started");
          this.isTaskStarted = true;
          this.emit("status", { status: "listening" });
          break;

        case "result-generated":
          this.handleResultGenerated(message.payload);
          break;

        case "task-finished":
          logger.info("[ASR] task finished");
          this.isTaskStarted = false;
          this.emit("status", { status: "idle" });
          break;

        case "task-failed":
          logger.error("[ASR] task failed:", message.header.error_message);
          this.emit("error", message.header.error_message || "Task failed");
          this.emit("status", {
            status: "error",
            error: message.header.error_message,
          });
          break;
      }
    } catch (err) {
      logger.error("[ASR] parse message error:", err);
    }
  }

  private handleResultGenerated(payload: FunASRMessagePayload): void {
    if (!payload.output?.sentence) return;

    const sentence = payload.output.sentence;

    // Skip heartbeat messages
    if (sentence.heartbeat) return;

    // Emit transcription result
    this.emit("transcription", {
      text: sentence.text,
      sentence_end: sentence.sentence_end,
    });
  }

  destroy(): void {
    this.stopRecognition();
    this.removeAllListeners();
  }
}
