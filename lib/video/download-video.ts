import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"

const execFileAsync = promisify(execFile)

export async function downloadVideo(
  url: string,
  outputPath: string
) {
  const ytDlpPath = path.join(
    process.cwd(),
    "node_modules",
    ".pnpm",
    "youtube-dl-exec@3.1.14_debug@4.4.3",
    "node_modules",
    "youtube-dl-exec",
    "bin",
    "yt-dlp"
  )

  await execFileAsync(
    ytDlpPath,
    [
      "--format",
      "mp4",
      "--output",
      outputPath,
      "--no-playlist",
      url,
    ],
    {
      maxBuffer: 10 * 1024 * 1024,
    }
  )

  return outputPath
}
