import fs from "fs/promises"
import path from "path"
import os from "os"

import { extractFrames } from "./extract-frames"
import { analyzeFrame } from "../vision/analyze-frames"

export type ProcessedVisualEvent = {
  timestamp: number
  description: string
}

export async function processVideoVision(
  videoPath: string
): Promise<ProcessedVisualEvent[]> {

  const outputDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "vidin-frames-")
  )

  const frames = await extractFrames(
    videoPath,
    outputDir
  )

  const events: ProcessedVisualEvent[] = []

  for (const frame of frames) {
    const imageBuffer = await fs.readFile(frame.path)

    const imageBase64 = imageBuffer.toString("base64")

    const analysis = await analyzeFrame(imageBase64)

    events.push({
      timestamp: frame.timestamp,
      description: analysis.description,
    })
  }

  return events
}
