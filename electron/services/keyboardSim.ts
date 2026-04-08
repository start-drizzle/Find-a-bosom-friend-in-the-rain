/**
 * Keyboard Simulation Service
 *
 * 开发环境：调用 Python 脚本 keyboard_input.py
 * 打包环境：调用 PyInstaller 打包的 keyboard_input.exe
 *
 * 并发安全：同一时刻只允许一个 exe 运行。
 * 新请求到达时会自动 kill 旧进程，防止多个 exe 同时打字导致字符重复。
 */

import { spawn, type ChildProcess } from 'child_process';
import { app } from 'electron';
import path from 'node:path';
import { logger } from './logger';

/** Delay before spawning to allow the target window to regain focus */
const KEYBOARD_INPUT_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 判断是否为打包环境
 */
function isPackaged(): boolean {
  return app.isPackaged;
}

interface SpawnConfig {
  command: string;
  args: string[];
}

/**
 * 获取执行命令和参数
 * - 开发环境：dist-keyboard/keyboard_input.exe <text>
 * - 打包环境：app 根目录下 keyboard_input.exe <text>
 */
function getSpawnConfig(text: string): SpawnConfig {
  if (!isPackaged()) {
    const projectRoot = path.dirname(process.env.APP_ROOT || process.cwd());
    return { command: path.join(projectRoot, 'dist-keyboard', 'keyboard_input.exe'), args: [text] };
  }

  const appPath = app.getAppPath();
  const appRoot = path.dirname(appPath);
  return { command: path.join(appRoot, 'keyboard_input.exe'), args: [text] };
}

/** 当前正在运行的子进程 */
let runningChild: ChildProcess | null = null;
/** 递增代数：每次启动新进程时 +1，旧进程的 close handler 通过闭包捕获的代数判断自己是否已被取代 */
let generation = 0;

function execCommand(config: SpawnConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    // Kill 之前还在运行的 exe，防止多个实例同时打字
    if (runningChild) {
      logger.info('[keyboardSim] Superseded previous exe');
      runningChild.kill();
      runningChild = null;
    }

    generation++;
    const thisGen = generation;

    logger.info(`[keyboardSim] spawning: ${config.command}`);

    const child = spawn(config.command, config.args, {
      windowsHide: true,
    });
    runningChild = child;

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (runningChild === child) runningChild = null;
      if (thisGen !== generation) return; // 被新请求取代，静默退出
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `exit ${code}`));
    });

    child.on('error', (err) => {
      if (runningChild === child) runningChild = null;
      if (thisGen === generation) reject(err);
    });
  });
}

/**
 * 模拟键盘输出：Ctrl+A → Backspace → 输入文本
 * 同一时刻只运行一个 exe；新请求会取代旧请求。
 */
export async function simulateKeyboardOutput(text: string): Promise<void> {
  if (!text) return;

  logger.info(`[keyboardSim] simulateKeyboardOutput: "${text.slice(0, 50)}"`);
  await sleep(KEYBOARD_INPUT_DELAY_MS);

  try {
    const config = getSpawnConfig(text);
    await execCommand(config);
    logger.info('[keyboardSim] output complete');
  } catch (e) {
    logger.error('[keyboardSim] error:', e);
  }
}
