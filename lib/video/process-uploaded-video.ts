import fs from "fs/promises"
import os from "os"
import path from "path"
import { processVideoVision } from "./process-video-vision"

export async function processUploadedVideo(file: File) {
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "vidin-upload-")
  )

  try {
    const extension = path.extname(file.name) || ".mp4"
    const videoPath = path.join(tempDir, `source${extension}`)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(videoPath, buffer)

    return await processVideoVision(videoPath)
  } finally {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    })
  }
}
