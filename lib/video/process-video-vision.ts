import fs from "fs/promises"
import path from "path"
import os from "os"

import { extractFrames } from "./extract-frames"
import { analyzeFrame } from "../vision/analyze-frames"

export type ProcessedVisualEvent = {
  timestamp: number
  eventType:
    | "on_screen_text"
    | "slide"
    | "scene"
    | "action"
    | "object"
    | "visual_description"
  content: string
}

export async function processVideoVision(
  videoPath: string
): Promise<ProcessedVisualEvent[]> {
  const outputDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "vidin-frames-")
  )

  try {
    const frames = await extractFrames(
      videoPath,
      outputDir
    )

    console.log("VISION: extracted frame count", frames.length)

    const events: ProcessedVisualEvent[] = []

    for (const frame of frames) {
      const imageBuffer = await fs.readFile(frame.path)
      const imageBase64 = imageBuffer.toString("base64")

      const analysis = await analyzeFrame(imageBase64)

      for (const evidence of analysis.evidence) {
        events.push({
          timestamp: frame.timestamp,
          eventType: evidence.type,
          content: evidence.content,
        })
      }
    }

    return events
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true })
  }
}
