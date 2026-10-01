import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MAX_INPUT_LENGTH = 4096

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
        { error: "You must be signed in to use Voice Intelligence." },
        { status: 401 }
      )
    }

    const body = await request.json()

    const text =
      typeof body?.text === "string"
        ? body.text.trim()
        : ""

    if (!text) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      )
    }

    if (text.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text is too long for one speech request. Maximum length is ${MAX_INPUT_LENGTH} characters.`,
        },
        { status: 400 }
      )
    }

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: text,
      instructions:
        "Speak clearly, naturally, warmly, and intelligently. Use a steady pace suitable for listening to an AI-generated recording analysis.",
      response_format: "mp3",
    })

    const audioBuffer = Buffer.from(await speech.arrayBuffer())

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Speech generation error:", error)

    return NextResponse.json(
      {
        error: "Voice generation failed.",
      },
      { status: 500 }
    )
  }
}
