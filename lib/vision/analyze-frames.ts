import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type VisualAnalysis = {
  description: string
  objects: string[]
  actions: string[]
}

export async function analyzeFrame(
  imageBase64: string
): Promise<VisualAnalysis> {

  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
You are VidIn's visual intelligence system.

Analyze this video frame like a human watching a video.

Identify:
- What is happening?
- Important objects
- Actions being performed
- Any diagrams, text, people, tools, or environments.

Be factual.
Do not guess.
`,
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "low",
          },
        ],
      },
    ],
  })

  return {
    description: response.output_text,
    objects: [],
    actions: [],
  }
}
