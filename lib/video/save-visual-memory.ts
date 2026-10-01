import { createClient } from "@/lib/supabase/server"

export type VisualMemoryEvent = {
  timestamp: number
  description: string
}

export async function saveVisualMemory(
  recordingId: string,
  userId: string,
  events: VisualMemoryEvent[]
) {
  if (!events.length) {
    return
  }

  const supabase = await createClient()

  const visualEvents = events.map((event) => ({
    recording_id: recordingId,
    user_id: userId,
    timestamp_seconds: event.timestamp,
    event_type: "visual_description",
    content: event.description,
  }))

  const { error } = await supabase
    .from("visual_events")
    .insert(visualEvents)

  if (error) {
    console.error(
      "Visual memory save error:",
      error
    )

    throw new Error(
      "Failed to save visual memory."
    )
  }
}
