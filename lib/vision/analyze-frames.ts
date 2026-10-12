import { VIDIN_MODELS } from "@/lib/ai/models"
import OpenAI from "openai"

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export type VisualEvidenceType =
  | "on_screen_text"
  | "slide"
  | "scene"
  | "action"
  | "object"
  | "visual_description"

export type VisualEvidence = {
  type: VisualEvidenceType
  content: string
}

export type VisualAnalysis = {
  description: string
  evidence: VisualEvidence[]
}

export async function analyzeFrame(
  imageBase64: string
): Promise<VisualAnalysis> {
  const openai = getOpenAIClient()

  const response = await openai.responses.create({
    model: VIDIN_MODELS.vision,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `
You are VidIn's visual intelligence system.

Analyze this video frame as timestamped evidence for a media intelligence system.

Return ONLY valid JSON in this exact shape:

{
  "description": "brief factual description of the frame",
  "evidence": [
    {
      "type": "on_screen_text | slide | scene | action | object | visual_description",
      "content": "specific factual observation"
    }
  ]
}

Rules:
- Extract important readable on-screen text when visible.
- If the frame is a presentation slide, identify it as "slide".
- Describe important scenes as "scene".
- Describe meaningful visible actions as "action".
- Identify important objects when relevant as "object".
- Use "visual_description" only for useful visual information that does not fit the other types.
- Do not guess or invent text.
- Do not infer information that cannot be seen.
- Keep evidence concise and factual.
- If there is no useful evidence, return an empty evidence array.
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

  try {
    const parsed = JSON.parse(response.output_text)

    return {
      description:
        typeof parsed.description === "string"
          ? parsed.description
          : "",
      evidence: Array.isArray(parsed.evidence)
        ? parsed.evidence.filter(
            (item: unknown): item is VisualEvidence =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as VisualEvidence).type === "string" &&
              typeof (item as VisualEvidence).content === "string"
          )
        : [],
    }
  } catch {
    return {
      description: response.output_text,
      evidence: [
        {
          type: "visual_description",
          content: response.output_text,
        },
      ],
    }
  }
}
