import { NextResponse } from "next/server"
import OpenAI from "openai"

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
      model: "gpt-4o-transcribe",
    })

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
    })
  } catch (error) {
    console.error("Transcription error:", error)

    return NextResponse.json(
      {
        error: "Transcription failed.",
      },
      { status: 500 }
    )
  }
}