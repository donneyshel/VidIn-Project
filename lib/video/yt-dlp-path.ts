import 'server-only'

import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function getYtDlpPath(): string {
  const entry = require.resolve('youtube-dl-exec')

  return path.resolve(
    path.dirname(entry),
    '..',
    'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
  )
}
