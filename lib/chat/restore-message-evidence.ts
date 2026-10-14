export type StoredEvidenceReference = {
  id: string
  type: 'transcript_chunk' | 'visual_event'
  timestamp?: number
  content: string
}

export function restoreMessageEvidence(
  messages: unknown,
): Record<string, StoredEvidenceReference[]> {
  const restored: Record<string, StoredEvidenceReference[]> = {}

  if (!Array.isArray(messages)) return restored

  for (const message of messages) {
    if (
      !message ||
      typeof message !== 'object' ||
      typeof message.id !== 'string' ||
      message.role !== 'assistant' ||
      !Array.isArray(message.evidence)
    ) continue

    const valid = message.evidence.filter(
      (item: unknown): item is StoredEvidenceReference => {
        if (!item || typeof item !== 'object') return false

        const reference = item as Record<string, unknown>

        return (
          typeof reference.id === 'string' &&
          (reference.type === 'transcript_chunk' ||
            reference.type === 'visual_event') &&
          (
            reference.timestamp === undefined ||
            (
              typeof reference.timestamp === 'number' &&
              Number.isFinite(reference.timestamp)
            )
          ) &&
          typeof reference.content === 'string'
        )
      }
    )

    if (valid.length > 0) {
      restored[message.id] = valid
    }
  }

  return restored
}
