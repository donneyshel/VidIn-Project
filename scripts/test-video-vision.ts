import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
})

import { processVideo } from "../lib/video/process-video"

async function main() {
  const url = process.argv[2]

  if (!url) {
    throw new Error("Provide a video URL")
  }

  const result = await processVideo(url)

  console.log(
    JSON.stringify(result, null, 2)
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
