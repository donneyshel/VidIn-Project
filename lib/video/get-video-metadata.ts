import { execFile } from "child_process"
import { promisify } from "util"
import { getYtDlpPath } from "./yt-dlp-path"
import path from "path"
import fs from "fs"

const execFileAsync = promisify(execFile)

export async function getVideoMetadata(url: string) {
  const cookiesPath = path.join(process.cwd(), "cookies.txt")

  const args = [
    "--skip-download",
    "--no-playlist",
    "--no-warnings",
    "--js-runtimes",
    "node",
    "--print",
    "%(title|)j",
    "--print",
    "%(thumbnail|)j",
    "--print",
    "%(duration|)j",
    "--print",
    "%(extractor_key|)j",
  ]

  if (fs.existsSync(cookiesPath)) {
    args.push("--cookies", cookiesPath)
  }

  args.push(url)

  const { stdout } = await execFileAsync(
    getYtDlpPath(),
    args,
    { maxBuffer: 1024 * 1024, timeout: 20000 }
  )

  const lines = stdout.trim().split("\n")

  function parseValue(index: number): unknown {
    try {
      return JSON.parse(lines[index] ?? "null")
    } catch {
      return null
    }
  }

  const title = parseValue(0)
  const thumbnail = parseValue(1)
  const duration = parseValue(2)
  const platform = parseValue(3)

  return {
    title: typeof title === "string" ? title : null,
    thumbnailUrl: typeof thumbnail === "string" ? thumbnail : null,
    durationSeconds: typeof duration === "number" ? duration : null,
    platform: typeof platform === "string" ? platform : null,
    sourceUrl: url,
  }
}
