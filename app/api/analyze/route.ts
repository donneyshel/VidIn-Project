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

    const body = await request.json()
    const transcript = body?.transcript

    if (typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { error: "A transcript is required." },
        { status: 400 }
      )
    }

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
      input: transcript,
    })

    return NextResponse.json({
      success: true,
      analysis: response.output_text,
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
