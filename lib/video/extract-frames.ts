import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"

const execFileAsync = promisify(execFile)

export async function extractFrames(
  videoPath: string,
  outputDir: string
) {
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
}
