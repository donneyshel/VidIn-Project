import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import { getYtDlpCookies } from "./yt-dlp-cookies"

import { getYtDlpPath } from "./yt-dlp-path"

const execFileAsync = promisify(execFile)

export async function downloadVideo(
  url: string,
  outputPath: string
) {
  const ytDlpPath = getYtDlpPath()

  const cookies = await getYtDlpCookies()

  const ytDlpArgs = [
    "--js-runtimes",
    "node",
    "--format",
    "best[ext=mp4][vcodec!=none][acodec!=none]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best[acodec!=none]/bestaudio/best",
    "--merge-output-format",
    "mp4",
    "--output",
    outputPath,
    "--print",
    "after_move:filepath",
    "--no-playlist",
  ]

  if (cookies.cookiesPath) {
    ytDlpArgs.push("--cookies", cookies.cookiesPath)
  }

  ytDlpArgs.push(url)

  try {
    const { stdout } = await execFileAsync(
      ytDlpPath,
      ytDlpArgs,
      { maxBuffer: 10 * 1024 * 1024 }
    )

    const actualPath = stdout.trim().split("\\n").at(-1)?.trim()

    if (!actualPath) {
      throw new Error("Downloader did not report a media filepath.")
    }

    await fs.access(actualPath)
    return actualPath
  } finally {
    await cookies.cleanup()
  }
}
