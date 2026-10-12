import { VIDIN_MODELS } from "@/lib/ai/models"
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'


type TranscriptChunk = {
  id: string
  chunk_index: number
  start_time: number
  end_time: number
  content: string
}

type VisualEvent = {
  id: string
  timestamp_seconds: number
  event_type: string
  content: string
}

type AnalysisEvidenceReference = {
  id: string
  reason: string
}

function formatSeconds(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function buildEvidenceContext(
  transcriptChunks: TranscriptChunk[],
  visualEvents: VisualEvent[],
) {
  const transcriptEvidence = transcriptChunks
    .map(
      (chunk) =>
        `[TRANSCRIPT_CHUNK id=${chunk.id} time=${formatSeconds(
          chunk.start_time,
        )}-${formatSeconds(chunk.end_time)}]\n${chunk.content}`,
    )
    .join('\n\n')

  const visualEvidence = visualEvents
    .map(
      (event) =>
        `[VISUAL_EVENT id=${event.id} time=${formatSeconds(
          event.timestamp_seconds,
        )} type=${event.event_type}]\n${event.content}`,
    )
    .join('\n\n')

  return {
    transcriptEvidence,
    visualEvidence,
  }
}

function cleanModelOutput(text: string) {
  return text
    .trim()
    .replace(/^```(?:markdown|md|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function buildFallbackAnalysis(
  summary: string,
  keyInsights: string[],
  mainTopics: string[],
  takeaways: string[],
  actionItems: string[],
) {
  return [
    'SUMMARY',
    summary || 'No summary was produced.',
    '',
    'KEY INSIGHTS',
    ...(keyInsights.length
      ? keyInsights.map((item) => `- ${item}`)
      : ['- No key insights were identified.']),
    '',
    'MAIN TOPICS',
    ...(mainTopics.length
      ? mainTopics.map((item) => `- ${item}`)
      : ['- No main topics were identified.']),
    '',
    'IMPORTANT TAKEAWAYS',
    ...(takeaways.length
      ? takeaways.map((item) => `- ${item}`)
      : ['- No important takeaways were identified.']),
    '',
    'ACTION ITEMS',
    ...(actionItems.length
      ? actionItems.map((item) => `- ${item}`)
      : ['- No action items were identified.']),
  ].join('\n')
}

function buildEvidenceAwareAnalysis(raw: string) {
  const cleaned = cleanModelOutput(raw)

  try {
    const parsed = JSON.parse(cleaned)

    const summary =
      typeof parsed.summary === 'string' ? parsed.summary.trim() : ''

    const keyInsights = Array.isArray(parsed.keyInsights)
      ? parsed.keyInsights
          .map((item: unknown) =>
            typeof item === 'string'
              ? item.trim()
              : typeof item === 'object' &&
                  item !== null &&
                  'text' in item &&
                  typeof item.text === 'string'
                ? item.text.trim()
                : '',
          )
          .filter(Boolean)
      : []

    const mainTopics = Array.isArray(parsed.mainTopics)
      ? parsed.mainTopics
          .filter((item: unknown): item is string => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []

    const takeaways = Array.isArray(parsed.importantTakeaways)
      ? parsed.importantTakeaways
          .filter((item: unknown): item is string => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems
          .filter((item: unknown): item is string => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []

    const evidence: AnalysisEvidenceReference[] = Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              typeof item === 'object' && item !== null,
          )
          .map((item: Record<string, unknown>) => ({
            id: typeof item.id === 'string' ? item.id.trim() : '',
            reason:
              typeof item.reason === 'string' ? item.reason.trim() : '',
          }))
          .filter((item: AnalysisEvidenceReference) => item.id)
      : []

    return {
      analysis: buildFallbackAnalysis(
        summary,
        keyInsights,
        mainTopics,
        takeaways,
        actionItems,
      ),
      evidence,
    }
  } catch {
    return {
      analysis: cleaned,
      evidence: [],
    }
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 },
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const body = await request.json()

    const recordingId =
      typeof body?.recordingId === 'string' ? body.recordingId.trim() : ''

    const transcript =
      typeof body?.transcript === 'string' ? body.transcript.trim() : ''

    if (!recordingId) {
      return NextResponse.json(
        { error: 'A recording ID is required.' },
        { status: 400 },
      )
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'A transcript is required before analysis.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to analyze a recording.' },
        { status: 401 },
      )
    }

    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .select('id,title,transcript')
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .single()

    if (recordingError || !recording) {
      return NextResponse.json(
        { error: 'Recording not found.' },
        { status: 404 },
      )
    }

    const savedTranscript = recording.transcript?.trim() || transcript.trim()

    const [
      { data: transcriptChunks, error: transcriptChunksError },
      { data: visualEvents, error: visualEventsError },
    ] = await Promise.all([
      supabase
        .from('transcript_chunks')
        .select('id,chunk_index,start_time,end_time,content')
        .eq('recording_id', recordingId)
        .eq('user_id', user.id)
        .order('chunk_index', { ascending: true }),

      supabase
        .from('visual_events')
        .select('id,timestamp_seconds,event_type,content')
        .eq('recording_id', recordingId)
        .eq('user_id', user.id)
        .order('timestamp_seconds', { ascending: true }),
    ])

    if (transcriptChunksError) {
      console.error('Transcript evidence query failed:', transcriptChunksError)
    }

    if (visualEventsError) {
      console.error('Visual evidence query failed:', visualEventsError)
    }

    const safeTranscriptChunks = (transcriptChunks ??
      []) as TranscriptChunk[]

    const safeVisualEvents = (visualEvents ?? []) as VisualEvent[]

    const { transcriptEvidence, visualEvidence } = buildEvidenceContext(
      safeTranscriptChunks,
      safeVisualEvents,
    )

    const evidencePrompt = [
      transcriptEvidence
        ? `TRANSCRIPT EVIDENCE\n\n${transcriptEvidence}`
        : `TRANSCRIPT EVIDENCE\n\n${savedTranscript}`,
      visualEvidence
        ? `VISUAL EVIDENCE\n\n${visualEvidence}`
        : 'VISUAL EVIDENCE\n\nNo visual evidence is available.',
    ].join('\n\n---\n\n')

    const response = await openai.responses.create({
      model: VIDIN_MODELS.intelligence,
      instructions: `
You are VidIn's multimodal intelligence engine.

Analyze one recorded video using ONLY the supplied evidence.

The evidence may contain:
1. Timestamped transcript chunks.
2. Timestamped visual events detected from the video.

Ground factual claims in the evidence.

Rules:
- Never invent facts, names, numbers, quotes, events, or conclusions.
- Do not claim that something was spoken if it only appears visually.
- Do not claim that something appeared visually if the supplied visual evidence does not support it.
- Reasonable conclusions are allowed, but clearly distinguish inference from direct evidence.
- If the evidence is insufficient for a claim, say that the evidence is insufficient.
- Preserve important names, facts, numbers, arguments, examples, and conclusions.
- Prefer specific evidence over generic observations.
- Use timestamps when they help identify where an important point occurs.
- Keep the analysis concise enough to be useful.

Return ONLY valid JSON with exactly this shape:

{
  "summary": "A concise summary.",
  "keyInsights": [
    "Insight 1",
    "Insight 2"
  ],
  "mainTopics": [
    "Topic 1",
    "Topic 2"
  ],
  "importantTakeaways": [
    "Takeaway 1",
    "Takeaway 2"
  ],
  "actionItems": [
    "Action item 1"
  ],
  "evidence": [
    {
      "id": "exact evidence ID",
      "reason": "Why this evidence supports the analysis."
    }
  ]
}

Evidence rules:
- Select only evidence that directly supports the summary, key insights, takeaways, or action items.
- Use the exact IDs from the supplied transcript chunks or visual events.
- Prefer a small set of strong evidence items over many weak ones.
- Do not invent evidence IDs.
- Include the reason each selected item supports the analysis.

Do not wrap the JSON in markdown fences.
`,
      input: evidencePrompt,
    })

    const rawAnalysis = response.output_text?.trim()

    if (!rawAnalysis) {
      return NextResponse.json(
        { error: 'No analysis was returned by the AI model.' },
        { status: 502 },
      )
    }

    const parsedAnalysis = buildEvidenceAwareAnalysis(rawAnalysis)
    const analysis = parsedAnalysis.analysis

    const transcriptEvidenceById = new Map(
      safeTranscriptChunks.map((chunk) => [chunk.id, {
        id: chunk.id,
        type: 'transcript_chunk' as const,
        startTime: chunk.start_time,
        endTime: chunk.end_time,
        content: chunk.content,
      }]),
    )

    const visualEvidenceById = new Map(
      safeVisualEvents.map((event) => [event.id, {
        id: event.id,
        type: 'visual_event' as const,
        timestamp: event.timestamp_seconds,
        eventType: event.event_type,
        content: event.content,
      }]),
    )

    const selectedEvidence = parsedAnalysis.evidence
      .map((reference) => {
        const item = transcriptEvidenceById.get(reference.id) ?? visualEvidenceById.get(reference.id)
        return item ? { ...item, reason: reference.reason } : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    const { data: updatedRecording, error: updateError } = await supabase
      .from('recordings')
      .update({
        analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordingId)
      .eq('user_id', user.id)
      .select('id,title,analysis')
      .single()

    if (updateError) {
      console.error('Failed to save analysis:', updateError)

      return NextResponse.json(
        { error: 'Analysis was generated but could not be saved.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      recording: updatedRecording,
      evidence: selectedEvidence,
    })
  } catch (error) {
    console.error('Analysis error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while analyzing the recording.',
      },
      { status: 500 },
    )
  }
}
