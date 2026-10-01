import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

const execFileAsync = promisify(execFile)

export type ExtractedFrame = {
  path: string
  timestamp: number
}

export async function extractFrames(
  videoPath: string,
  outputDir: string
): Promise<ExtractedFrame[]> {

  const outputPattern = path.join(
    outputDir,
    "frame-%04d.jpg"
  )

  await execFileAsync("ffmpeg", [
    "-i",
    videoPath,

    "-vf",
    "fps=1/10",

    "-q:v",
    "2",

    outputPattern,
  ])

  const files = await fs.readdir(outputDir)

  const frames = files
    .filter((file) => file.endsWith(".jpg"))
    .sort()
    .map((file, index) => ({
      path: path.join(outputDir, file),
      timestamp: index * 10,
    }))

  return frames
}
