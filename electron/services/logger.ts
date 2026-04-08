/**
 * Simple file logger for Electron main process.
 *
 * Log files are written to: app.getPath('userData')/logs/YYYY-MM-DD.log
 * Each entry: [HH:MM:SS] [LEVEL] message
 * Automatically cleans up logs older than 7 days.
 */

import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

type LogLevel = 'INFO' | 'WARN' | 'ERROR'

const MAX_LOG_AGE_DAYS = 7

function getLogDir(): string {
  return path.join(app.getPath('userData'), 'logs')
}

function getLogFilePath(): string {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return path.join(getLogDir(), `${date}.log`)
}

function ensureLogDir(): void {
  const dir = getLogDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function cleanOldLogs(): void {
  try {
    const dir = getLogDir()
    const files = fs.readdirSync(dir)
    const cutoff = Date.now() - MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000

    for (const file of files) {
      if (!file.endsWith('.log')) continue
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath)
      }
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

function formatMessage(level: LogLevel, ...args: unknown[]): string {
  const time = new Date().toISOString().slice(11, 19) // HH:MM:SS
  const message = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')
  return `[${time}] [${level}] ${message}\n`
}

function write(level: LogLevel, ...args: unknown[]): void {
  const line = formatMessage(level, ...args)

  // Also print to console (visible in terminal during dev)
  if (level === 'ERROR') {
    console.error(...args)
  } else if (level === 'WARN') {
    console.warn(...args)
  } else {
    console.log(...args)
  }

  // Append to log file
  try {
    ensureLogDir()
    fs.appendFileSync(getLogFilePath(), line)
  } catch {
    // If writing fails (e.g. packaged app permissions), don't crash
  }
}

/** Clean up old logs on startup */
cleanOldLogs()

export const logger = {
  info: (...args: unknown[]) => write('INFO', ...args),
  warn: (...args: unknown[]) => write('WARN', ...args),
  error: (...args: unknown[]) => write('ERROR', ...args),
}
