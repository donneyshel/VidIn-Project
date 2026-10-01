export type TranscriptSegment = {
  id?: number
  start: number
  end: number
  text: string
}

export type TranscriptChunk = {
  chunk_index: number
  start_time: number
  end_time: number
  content: string
}

const MAX_CHARS = 4000
const MAX_DURATION_SECONDS = 90

export function buildTranscriptChunks(
  segments: TranscriptSegment[]
): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = []

  let currentContent: string[] = []
  let currentStart = 0
  let currentEnd = 0
  let currentChars = 0

  for (const segment of segments) {
    const text = segment.text?.trim()

    if (!text) {
      continue
    }

    if (currentContent.length === 0) {
      currentStart = segment.start
    }

    const projectedChars =
      currentChars + (currentContent.length > 0 ? 1 : 0) + text.length

    const projectedDuration = segment.end - currentStart

    if (
      currentContent.length > 0 &&
      (projectedChars > MAX_CHARS ||
        projectedDuration > MAX_DURATION_SECONDS)
    ) {
      chunks.push({
        chunk_index: chunks.length,
        start_time: currentStart,
        end_time: currentEnd,
        content: currentContent.join(" "),
      })

      currentContent = []
      currentChars = 0
      currentStart = segment.start
    }

    currentContent.push(text)
    currentChars += (currentContent.length > 1 ? 1 : 0) + text.length
    currentEnd = segment.end
  }

  if (currentContent.length > 0) {
    chunks.push({
      chunk_index: chunks.length,
      start_time: currentStart,
      end_time: currentEnd,
      content: currentContent.join(" "),
    })
  }

  return chunks
}
