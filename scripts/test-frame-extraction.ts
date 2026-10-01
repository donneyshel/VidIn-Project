import { extractFrames } from "../lib/video/extract-frames"
import path from "path"
import os from "os"
import fs from "fs/promises"

async function main() {
  const videoPath = path.join(
    process.cwd(),
    "test-video.mp4"
  )

  const outputDir = path.join(
    os.tmpdir(),
    "vidin-test-frames"
  )

  await fs.mkdir(outputDir, {
    recursive: true,
  })

  await extractFrames(
    videoPath,
    outputDir
  )

  const files = await fs.readdir(outputDir)

  console.log("Frames created:")
  console.log(files)
}

main()
