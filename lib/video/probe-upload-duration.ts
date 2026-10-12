import 'server-only'

import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { probeMediaDuration } from './probe-media-duration'

export async function probeUploadDuration(file: File): Promise<number> {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'vidin-duration-'),
  )

  try {
    const extension = path.extname(file.name) || '.media'
    const filePath = path.join(
      tempDir,
      `${randomUUID()}${extension}`,
    )

    const buffer = Buffer.from(await file.arrayBuffer())

    if (buffer.length === 0) {
      throw new Error('The uploaded media file is empty.')
    }

    await fs.writeFile(filePath, buffer)

    return await probeMediaDuration(filePath)
  } finally {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    })
  }
}
