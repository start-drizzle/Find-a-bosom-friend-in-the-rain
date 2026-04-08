import { registerWindowHandlers } from "../handlers/window";
import { registerTranslateHandler } from "../handlers/translate";
import { registerDebugWindowHandler } from "../handlers/debugWindow";
import { registerASRHandler } from "../handlers/asrHandler";
import { registerScreenshotHandler } from "../handlers/screenshot";
import { registerYoloDetectionHandler } from "../handlers/yoloDetection";

export function registerIpcHandlers(): void {
  registerWindowHandlers();
  registerTranslateHandler();
  registerDebugWindowHandler();
  registerScreenshotHandler();
  registerYoloDetectionHandler();
  registerASRHandler();
}
