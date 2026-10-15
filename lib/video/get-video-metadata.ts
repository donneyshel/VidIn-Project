import { execFile } from "child_process"
import { promisify } from "util"
import { getYtDlpPath } from "./yt-dlp-path"
import path from "path"
import fs from "fs"

const execFileAsync = promisify(execFile)

export async function getVideoMetadata(url: string) {
  const cookiesPath = path.join(process.cwd(), "cookies.txt")
  const args = ["--dump-single-json", "--skip-download", "--no-playlist"]
  if (fs.existsSync(cookiesPath)) args.push("--cookies", cookiesPath)
  args.push(url)

  const { stdout } = await execFileAsync(
    getYtDlpPath(),
    args,
    { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }
  )

  const data = JSON.parse(stdout)

  return {
    title: typeof data.title === "string" ? data.title : null,
    thumbnailUrl: typeof data.thumbnail === "string" ? data.thumbnail : null,
    durationSeconds: typeof data.duration === "number" ? data.duration : null,
    platform: typeof data.extractor_key === "string" ? data.extractor_key : null,
    sourceUrl: url,
  }
}
