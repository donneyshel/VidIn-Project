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

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to transcribe media." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file was provided." },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })

    const segments = transcription.segments ?? []

    const title = file.name
      ? file.name.replace(/\.[^/.]+$/, "")
      : "Untitled recording"

    const { data: recording, error: saveError } = await supabase
      .from("recordings")
      .insert({
        user_id: user.id,
        title,
        source_type: "upload",
        source_url: null,
        transcript: transcription.text,
        segments,
        duration_seconds:
          typeof transcription.duration === "number"
            ? transcription.duration
            : null,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Recording save error:", saveError)

      return NextResponse.json(
        {
          error: "Transcription succeeded, but the recording could not be saved.",
          details: saveError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments,
      recording,
    })
  } catch (error) {
    console.error("Transcription error:", error)

    return NextResponse.json(
      {
        error: "Transcription failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
