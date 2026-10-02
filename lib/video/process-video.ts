import fs from "fs/promises"
import path from "path"
import os from "os"

import { downloadVideo } from "./download-video"
import { processVideoVision } from "./process-video-vision"

export type VidInProcessingResult = {
  visualEvents: {
    timestamp: number
    description: string
  }[]
}

export async function processVideo(
  url: string
): Promise<VidInProcessingResult> {

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "vidin-processing-")
  )

  try {
    const videoPath = path.join(
      tempDir,
      "source.mp4"
    )

    await downloadVideo(
      url,
      videoPath
    )

    const visualEvents = await processVideoVision(
      videoPath
    )

    return {
      visualEvents,
    }

  } finally {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    })
  }
}
