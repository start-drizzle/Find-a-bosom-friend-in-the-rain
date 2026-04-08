import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, '..', '.env.local')
const dest = path.join(__dirname, '..', 'dist-electron', '.env.local')

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest)
  console.log('.env.local copied to dist-electron/')
} else {
  console.warn('.env.local not found, skipping copy')
}
