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

type EvidenceReference = {
  id: string
  type: 'transcript_chunk' | 'visual_event'
  startTime?: number
  endTime?: number
  timestamp?: number
  content: string
}

function formatSeconds(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function normalizeTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3)
}

function scoreEvidence(content: string, questionTokens: string[]) {
  const tokens = normalizeTokens(content)

  if (tokens.length === 0 || questionTokens.length === 0) {
    return 0
  }

  const tokenSet = new Set(tokens)

  return questionTokens.reduce(
    (score, token) => score + (tokenSet.has(token) ? 1 : 0),
    0,
  )
}

function selectEvidence(
  question: string,
  transcriptChunks: TranscriptChunk[],
  visualEvents: VisualEvent[],
) {
  const questionTokens = normalizeTokens(question)

  const overviewQuestion =
    /\b(all|every|entire|complete|list|enumerate|numbered|signs|steps|points)\b/i.test(
      question,
    )

  const visualBudget = 24000

  const chronologicalVisualEvents = [...visualEvents].sort(
    (a, b) => a.timestamp_seconds - b.timestamp_seconds,
  )

  const completeVisualLength = chronologicalVisualEvents.reduce(
    (total, event) => total + event.content.length + 120,
    0,
  )

  const useCompleteVisualEvidence =
    overviewQuestion && completeVisualLength <= visualBudget

  const scoredChunks = transcriptChunks
    .map((chunk) => ({
      chunk,
      score: scoreEvidence(chunk.content, questionTokens),
    }))
    .sort((a, b) => b.score - a.score)

  const selectedChunkIndexes = new Set<number>()

  for (const item of scoredChunks.slice(0, 8)) {
    if (item.score > 0) {
      selectedChunkIndexes.add(item.chunk.chunk_index)
    }
  }

  // Include neighboring transcript chunks for conversational context.
  for (const index of Array.from(selectedChunkIndexes)) {
    selectedChunkIndexes.add(index - 1)
    selectedChunkIndexes.add(index + 1)
  }

  let selectedChunks = transcriptChunks.filter((chunk) =>
    selectedChunkIndexes.has(chunk.chunk_index),
  )

  // If the question does not match specific words, give the model a small
  // amount of recent transcript context rather than the entire recording.
  if (selectedChunks.length === 0) {
    selectedChunks = transcriptChunks.slice(0, 8)
  }

  selectedChunks = selectedChunks.slice(0, 14)

  const selectedStartTimes = new Set(
    selectedChunks.flatMap((chunk) => [
      chunk.start_time,
      chunk.end_time,
    ]),
  )

  const selectedVisualEvents = visualEvents
    .map((event) => ({
      event,
      score: scoreEvidence(event.content, questionTokens),
    }))
    .sort((a, b) => b.score - a.score)
    .filter(
      (item) =>
        item.score > 0 ||
        Array.from(selectedStartTimes).some(
          (time) => Math.abs(time - item.event.timestamp_seconds) <= 15,
        ),
    )
    .slice(0, 12)
    .map((item) => item.event)

  return {
    selectedChunks,
    selectedVisualEvents: useCompleteVisualEvidence
      ? chronologicalVisualEvents
      : selectedVisualEvents,
    visualEvidenceComplete: useCompleteVisualEvidence,
  }
}

function cleanModelOutput(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function parseChatResponse(raw: string) {
  const cleaned = cleanModelOutput(raw)

  try {
    const parsed = JSON.parse(cleaned)

    const answer =
      typeof parsed.answer === 'string' ? parsed.answer.trim() : ''

    const evidence: EvidenceReference[] = Array.isArray(parsed.evidence)
      ? parsed.evidence
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              typeof item === 'object' && item !== null,
          )
          .map((item: Record<string, unknown>) => ({
            id: typeof item.id === 'string' ? item.id : '',
            type:
              item.type === 'visual_event'
                ? 'visual_event'
                : 'transcript_chunk',
            startTime:
              typeof item.startTime === 'number'
                ? item.startTime
                : undefined,
            endTime:
              typeof item.endTime === 'number' ? item.endTime : undefined,
            timestamp:
              typeof item.timestamp === 'number'
                ? item.timestamp
                : undefined,
            content:
              typeof item.content === 'string' ? item.content : '',
          }))
          .filter((item: EvidenceReference) => item.id)
      : []

    return {
      answer,
      evidence,
    }
  } catch {
    return {
      answer: cleaned,
      evidence: [],
    }
  }
}

function buildEvidenceContext(
  chunks: TranscriptChunk[],
  visualEvents: VisualEvent[],
) {
  const transcriptEvidence = chunks
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

  return [
    transcriptEvidence
      ? `TRANSCRIPT EVIDENCE\n\n${transcriptEvidence}`
      : 'TRANSCRIPT EVIDENCE\n\nNo matching transcript chunks were found.',
    visualEvidence
      ? `VISUAL EVIDENCE\n\n${visualEvidence}`
      : 'VISUAL EVIDENCE\n\nNo matching visual events were found.',
  ].join('\n\n---\n\n')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const recordingId = searchParams.get('recordingId')?.trim()

    if (!recordingId) {
      return NextResponse.json(
        { error: 'A recording ID is required.' },
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
        { error: 'You must be signed in to load this conversation.' },
        { status: 401 },
      )
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('recording_id', recordingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (conversationError) {
      console.error('Conversation lookup failed:', conversationError)

      return NextResponse.json(
        { error: 'Failed to load conversation.' },
        { status: 500 },
      )
    }

    if (!conversation) {
      return NextResponse.json({
        conversationId: null,
        messages: [],
      })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('conversation_messages')
      .select('id,role,content,created_at')
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Conversation messages lookup failed:', messagesError)

      return NextResponse.json(
        { error: 'Failed to load conversation messages.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: messages ?? [],
    })
  } catch (error) {
    console.error('Chat GET error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading the conversation.',
      },
      { status: 500 },
    )
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

    const question =
      typeof body?.question === 'string' ? body.question.trim() : ''

    if (!question) {
      return NextResponse.json(
        { error: 'A question is required.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    // Persistent recording-aware chat.
    if (recordingId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json(
          { error: 'You must be signed in to use recording chat.' },
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

      const savedTranscript =
        recording.transcript?.trim() || transcript.trim()

      if (!savedTranscript) {
        return NextResponse.json(
          { error: 'This recording does not have a transcript yet.' },
          { status: 400 },
        )
      }

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
        console.error(
          'Chat transcript evidence query failed:',
          transcriptChunksError,
        )
      }

      if (visualEventsError) {
        console.error(
          'Chat visual evidence query failed:',
          visualEventsError,
        )
      }

      const safeTranscriptChunks =
        (transcriptChunks ?? []) as TranscriptChunk[]

      const safeVisualEvents = (visualEvents ?? []) as VisualEvent[]

      const {
        selectedChunks,
        selectedVisualEvents,
        visualEvidenceComplete,
      } = selectEvidence(
        question,
        safeTranscriptChunks,
        safeVisualEvents,
      )

      const evidenceContext = buildEvidenceContext(
        selectedChunks,
        selectedVisualEvents,
      )

      let { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('recording_id', recordingId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (conversationError) {
        console.error('Conversation lookup failed:', conversationError)

        return NextResponse.json(
          { error: 'Failed to load conversation.' },
          { status: 500 },
        )
      }

      if (!conversation) {
        const { data: newConversation, error: createConversationError } =
          await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              recording_id: recordingId,
              title: recording.title || 'Recording conversation',
            })
            .select('id')
            .single()

        if (createConversationError || !newConversation) {
          console.error(
            'Conversation creation failed:',
            createConversationError,
          )

          return NextResponse.json(
            { error: 'Failed to create conversation.' },
            { status: 500 },
          )
        }

        conversation = newConversation
      }

      const { data: previousMessages, error: previousMessagesError } =
        await supabase
          .from('conversation_messages')
          .select('role,content')
          .eq('conversation_id', conversation.id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(30)

      if (previousMessagesError) {
        console.error(
          'Previous conversation lookup failed:',
          previousMessagesError,
        )

        return NextResponse.json(
          { error: 'Failed to load conversation history.' },
          { status: 500 },
        )
      }

      const { data: userMessage, error: userMessageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'user',
          content: question,
        })
        .select('id,role,content,created_at')
        .single()

      if (userMessageError || !userMessage) {
        console.error('User message save failed:', userMessageError)

        return NextResponse.json(
          { error: 'Failed to save your message.' },
          { status: 500 },
        )
      }

      const history = (previousMessages ?? [])
        .slice(-30)
        .map((message) => ({
          role: message.role as 'user' | 'assistant',
          content: message.content,
        }))

      const response = await openai.responses.create({
        model: VIDIN_MODELS.intelligence,
        instructions: `
You are VidIn's AI Chat assistant.

You are answering questions about ONE recorded video.

Use the supplied evidence as the factual source.

Rules:
- Answer only from the supplied recording evidence and conversation context.
- Never invent facts, names, numbers, quotes, events, or claims.
- If the evidence does not establish an answer, say that the recording does not provide enough evidence.
- Do not treat an inference as a direct statement from the recording.
- Distinguish transcript evidence from visual evidence.
- Preserve names, numbers, arguments, examples, and conclusions accurately.
- Use timestamps when they help the user locate the relevant part of the recording.
- Resolve pronouns and references using the conversation history when possible.
- Be natural, direct, and useful.
- Evidence IDs are authoritative. Only cite IDs actually present in the supplied evidence.

Return ONLY valid JSON:

{
  "answer": "Your grounded answer.",
  "evidence": [
    {
      "id": "exact evidence ID",
      "type": "transcript_chunk",
      "startTime": 0,
      "endTime": 10,
      "content": "Short supporting evidence description."
    }
  ]
}

Use an empty evidence array when the answer cannot be supported by the supplied evidence.
Do not wrap the JSON in markdown fences.
`,
        input: [
          {
            role: 'user',
            content: [
              safeTranscriptChunks.length === 0
                ? `RECORDING TRANSCRIPT FALLBACK\\n\\n${savedTranscript}`
                : 'RECORDING TRANSCRIPT: Use the selected timestamped transcript evidence below.',
              `\n\nVISUAL EVIDENCE COVERAGE: ${
                visualEvidenceComplete
                  ? 'Complete set of retrieved visual events.'
                  : 'Selected visual events only. Missing numbered items cannot be declared absent from the recording.'
              }`,
              `\n\n${evidenceContext}`,
              `\n\nCONVERSATION HISTORY\n\n${history
                .map(
                  (message) =>
                    `${message.role.toUpperCase()}: ${message.content}`,
                )
                .join('\n\n')}`,
              `\n\nCURRENT QUESTION\n\n${question}`,
            ].join('\n\n---\n\n'),
          },
        ],
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('[VidIn Chat Usage]', {
          model: VIDIN_MODELS.intelligence,
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
          totalTokens: response.usage?.total_tokens ?? null,
          selectedTranscriptChunks: selectedChunks.length,
          selectedVisualEvents: selectedVisualEvents.length,
          visualEvidenceComplete,
        })
      }

      const parsed = parseChatResponse(response.output_text || '')

      const allowedEvidence = new Map<string, EvidenceReference>()

      for (const chunk of selectedChunks) {
        allowedEvidence.set(chunk.id, {
          id: chunk.id,
          type: 'transcript_chunk',
          startTime: chunk.start_time,
          endTime: chunk.end_time,
          content: chunk.content,
        })
      }

      for (const event of selectedVisualEvents) {
        allowedEvidence.set(event.id, {
          id: event.id,
          type: 'visual_event',
          timestamp: event.timestamp_seconds,
          content: event.content,
        })
      }

      const verifiedEvidence: EvidenceReference[] = []
      const seenEvidenceIds = new Set<string>()

      for (const reference of parsed.evidence) {
        const original = allowedEvidence.get(reference.id)

        if (!original || seenEvidenceIds.has(reference.id)) {
          continue
        }

        seenEvidenceIds.add(reference.id)
        verifiedEvidence.push(original)
      }

      if (!parsed.answer) {
        return NextResponse.json(
          { error: 'No answer was returned by the AI model.' },
          { status: 502 },
        )
      }

      const { data: assistantMessage, error: assistantMessageError } =
        await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversation.id,
            user_id: user.id,
            role: 'assistant',
            content: parsed.answer,
          })
          .select('id,role,content,created_at')
          .single()

      if (assistantMessageError || !assistantMessage) {
        console.error(
          'Assistant message save failed:',
          assistantMessageError,
        )

        return NextResponse.json(
          { error: 'The answer was generated but could not be saved.' },
          { status: 500 },
        )
      }

      await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id)
        .eq('user_id', user.id)

      return NextResponse.json({
        answer: parsed.answer,
        conversationId: conversation.id,
        messages: [userMessage, assistantMessage],
        evidence: verifiedEvidence,
      })
    }

    // Legacy non-persistent chat path.
    if (!transcript) {
      return NextResponse.json(
        { error: 'A transcript is required when no recording ID is provided.' },
        { status: 400 },
      )
    }

    const response = await openai.responses.create({
      model: VIDIN_MODELS.intelligence,
      instructions: `
You are VidIn's AI Chat assistant.

Answer questions about the supplied transcript.

Rules:
- Use only the supplied transcript.
- Never invent facts, names, numbers, quotes, events, or claims.
- If the transcript does not provide enough evidence, say so.
- Be natural, direct, and useful.
`,
      input: `TRANSCRIPT\n\n${transcript}\n\nQUESTION\n\n${question}`,
    })

    const answer = response.output_text?.trim()

    if (!answer) {
      return NextResponse.json(
        { error: 'No answer was returned by the AI model.' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      answer,
      conversationId: null,
      messages: [],
      evidence: [],
    })
  } catch (error) {
    console.error('Chat error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Something went wrong while answering your question.',
      },
      { status: 500 },
    )
  }
}
