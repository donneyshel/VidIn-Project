import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type FFprobeResult = {
  format?: {
    duration?: string
  }
  streams?: {
    duration?: string
    duration_ts?: number
    time_base?: string
  }[]
}

export async function probeMediaDuration(
  filePath: string,
): Promise<number> {
  const { stdout } = await execFileAsync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=duration,duration_ts,time_base',
      '-of',
      'json',
      filePath,
    ],
    {
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    },
  )

  const result = JSON.parse(stdout) as FFprobeResult

  const candidates: number[] = []

  const formatDuration = Number(result.format?.duration)

  if (Number.isFinite(formatDuration) && formatDuration > 0) {
    candidates.push(formatDuration)
  }

  for (const stream of result.streams ?? []) {
    const streamDuration = Number(stream.duration)

    if (Number.isFinite(streamDuration) && streamDuration > 0) {
      candidates.push(streamDuration)
    }

    if (
      typeof stream.duration_ts === 'number' &&
      typeof stream.time_base === 'string'
    ) {
      const [numerator, denominator] = stream.time_base
        .split('/')
        .map(Number)

      if (
        Number.isFinite(numerator) &&
        Number.isFinite(denominator) &&
        denominator > 0
      ) {
        const duration =
          stream.duration_ts * (numerator / denominator)

        if (Number.isFinite(duration) && duration > 0) {
          candidates.push(duration)
        }
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      'Unable to determine media duration. Please use a valid audio or video file.',
    )
  }

  const durationSeconds = Math.ceil(Math.max(...candidates))

  if (!Number.isSafeInteger(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Invalid media duration.')
  }

  return durationSeconds
}
