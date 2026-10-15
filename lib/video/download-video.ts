import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"

import { getYtDlpPath } from "./yt-dlp-path"

const execFileAsync = promisify(execFile)

export async function downloadVideo(
  url: string,
  outputPath: string
) {
  const ytDlpPath = getYtDlpPath()

  const cookiesPath = path.join(
    process.cwd(),
    "cookies.txt"
  )

  const ytDlpArgs = [
    "--js-runtimes",
    "node",
    "--format",
    "mp4",
    "--output",
    outputPath,
    "--no-playlist",
  ]

  try {
    await fs.access(cookiesPath)

    ytDlpArgs.push(
      "--cookies",
      cookiesPath
    )
  } catch {
    // No local cookies file; continue without authentication.
  }

  ytDlpArgs.push(url)

  await execFileAsync(
    ytDlpPath,
    ytDlpArgs,
    {
      maxBuffer: 10 * 1024 * 1024,
    }
  )

  return outputPath
}
