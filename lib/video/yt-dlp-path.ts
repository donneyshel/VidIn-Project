import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

export function getYtDlpPath(): string {
  const executable = process.platform === 'win32'
    ? 'yt-dlp.exe'
    : 'yt-dlp'

  const binaryPath = path.resolve(
    process.cwd(),
    'node_modules',
    'youtube-dl-exec',
    'bin',
    executable,
  )

  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      'VidIn could not find the bundled yt-dlp executable. ' +
      'Check that youtube-dl-exec is installed.',
    )
  }

  return binaryPath
}
