import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      )
    }

    const body = await request.json()

    const recordingId =
      typeof body?.recordingId === "string"
        ? body.recordingId.trim()
        : ""

    const transcript =
      typeof body?.transcript === "string"
        ? body.transcript
        : ""

    if (!recordingId) {
      return NextResponse.json(
        { error: "A recording ID is required." },
        { status: 400 }
      )
    }

    if (!transcript.trim()) {
      return NextResponse.json(
        { error: "A transcript is required." },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to analyze a recording." },
        { status: 401 }
      )
    }

    const { data: recording, error: recordingError } = await supabase
      .from("recordings")
      .select("id, title, transcript")
      .eq("id", recordingId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (recordingError) {
      console.error("Recording lookup error:", recordingError)

      return NextResponse.json(
        { error: "Failed to load the recording." },
        { status: 500 }
      )
    }

    if (!recording) {
      return NextResponse.json(
        { error: "Recording not found." },
        { status: 404 }
      )
    }

    const savedTranscript = recording.transcript?.trim() || transcript.trim()

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions: `
You are VidIn's intelligence engine.

Your job is to understand the provided transcript deeply and accurately.

Do not invent information that is not supported by the transcript.
Do not claim that something was said if it was not present.
Preserve important names, facts, numbers, arguments, examples, and conclusions.

Return your analysis using exactly these sections:

SUMMARY
A concise but meaningful overview of what the recording is about.

KEY INSIGHTS
The most important ideas, facts, arguments, or observations from the recording.

MAIN TOPICS
The major subjects discussed in the recording.

IMPORTANT TAKEAWAYS
The things a listener should remember after hearing the recording.

ACTION ITEMS
Any tasks, recommendations, decisions, or next steps explicitly mentioned or clearly implied by the recording. If there are none, say "None identified."

Write for a human who wants to understand the recording without replaying the entire thing.
`,
      input: savedTranscript,
    })

    const analysis = response.output_text?.trim()

    if (!analysis) {
      return NextResponse.json(
        { error: "No analysis was returned." },
        { status: 500 }
      )
    }

    const { data: updatedRecording, error: updateError } = await supabase
      .from("recordings")
      .update({
        analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordingId)
      .eq("user_id", user.id)
      .select(
        "id, title, source_type, source_url, transcript, segments, duration_seconds, analysis, created_at, updated_at"
      )
      .single()

    if (updateError) {
      console.error("Analysis save error:", updateError)

      return NextResponse.json(
        { error: "Analysis was generated but could not be saved." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      recording: updatedRecording,
    })
  } catch (error) {
    console.error("Analysis error:", error)

    return NextResponse.json(
      {
        error: "AI analysis failed.",
      },
      { status: 500 }
    )
  }
}
