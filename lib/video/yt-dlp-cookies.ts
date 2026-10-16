import "server-only"

import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export async function getYtDlpCookies(): Promise<{
  cookiesPath: string | null
  cleanup: () => Promise<void>
}> {
  const encoded = process.env.YOUTUBE_COOKIES_BASE64?.trim()

  if (encoded) {
    const content = Buffer.from(encoded, "base64")

    if (!content.toString("utf8").startsWith("# Netscape HTTP Cookie File")) {
      throw new Error("Invalid YOUTUBE_COOKIES_BASE64 cookie format.")
    }

    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vidin-cookies-"))
    const cookiesPath = path.join(dir, "cookies.txt")

    try {
      await fs.writeFile(cookiesPath, content, { mode: 0o600 })
    } catch (error) {
      await fs.rm(dir, { recursive: true, force: true })
      throw error
    }

    return {
      cookiesPath,
      cleanup: () => fs.rm(dir, { recursive: true, force: true }),
    }
  }

  const localPath = path.join(process.cwd(), "cookies.txt")

  try {
    await fs.access(localPath)
    return { cookiesPath: localPath, cleanup: async () => {} }
  } catch {
    return { cookiesPath: null, cleanup: async () => {} }
  }
}
