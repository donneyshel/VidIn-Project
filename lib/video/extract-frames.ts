import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import { probeMediaDuration } from "./probe-media-duration"

const execFileAsync = promisify(execFile)

export type ExtractedFrame = {
  path: string
  timestamp: number
}

const MAX_FRAMES = 12
const SHORT_VIDEO_INTERVAL = 5

export async function extractFrames(
  videoPath: string,
  outputDir: string
): Promise<ExtractedFrame[]> {
  const duration = await probeMediaDuration(videoPath)

  const frameCount = Math.min(
    MAX_FRAMES,
    Math.max(1, Math.ceil(duration / SHORT_VIDEO_INTERVAL))
  )

  const timestamps = Array.from(
    { length: frameCount },
    (_, index) => {
      const interval = duration / frameCount
      return Math.min(
        duration - 0.1,
        (index + 0.5) * interval
      )
    }
  )

  const frames: ExtractedFrame[] = []

  for (let index = 0; index < timestamps.length; index++) {
    const timestamp = timestamps[index]
    const framePath = path.join(
      outputDir,
      `frame-${String(index + 1).padStart(4, "0")}.jpg`
    )

    await execFileAsync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-ss",
      String(timestamp),
      "-i",
      videoPath,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      framePath,
    ], {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    })

    await fs.access(framePath)

    frames.push({
      path: framePath,
      timestamp,
    })
  }

  return frames
}
