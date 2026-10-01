
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FileAudio,
  FileText,
  Loader2,
  Upload,
  Sparkles,
  Brain,
  MessageSquareText,
  Send,
  Link,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type TranscriptSegment = {
  id: number
  start: number
  end: number
  text: string
}

type SavedRecording = {
  id: string
  title: string
  source_type: string
  source_url: string | null
  transcript: string | null
  segments: TranscriptSegment[] | null
  duration_seconds: number | null
  analysis: string | null
  created_at: string
  updated_at: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

function formatTimestamp(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
}

export function InsightVaultDemo({
  initialRecording = null,
}: {
  initialRecording?: SavedRecording | null
}) {
  const [recordingId, setRecordingId] = useState<string | null>(
    initialRecording?.id ?? null
  )
  const [recordingTitle, setRecordingTitle] = useState(
    initialRecording?.title ?? ''
  )

  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState(
    initialRecording?.source_url ?? ''
  )
  const [sourceType, setSourceType] = useState<'file' | 'url' | ''>(
    initialRecording
      ? initialRecording.source_type === 'url'
        ? 'url'
        : 'file'
      : ''
  )

  const [transcript, setTranscript] = useState(
    initialRecording?.transcript ?? ''
  )
  const [segments, setSegments] = useState<TranscriptSegment[]>(
    Array.isArray(initialRecording?.segments)
      ? initialRecording.segments
      : []
  )
  const [analysis, setAnalysis] = useState(
  initialRecording?.analysis ?? ''
)
  const [question, setQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingTarget, setSpeakingTarget] = useState<
    'transcript' | 'analysis' | 'chat' | null
  >(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopRequested = useRef(false)
  const speechRunId = useRef(0)
  const [error, setError] = useState('')

  function clearResults() {
    setRecordingId(null)
    setRecordingTitle('')
    setTranscript('')
    setSegments([])
    setAnalysis('')
    setQuestion('')
    setChatAnswer('')
    setConversationId(null)
    setMessages([])
    setError('')
  }

  useEffect(() => {
    if (!recordingId) {
      setConversationId(null)
      setMessages([])
      setIsLoadingConversation(false)
      return
    }

    const currentRecordingId = recordingId
    let cancelled = false

    async function loadConversation() {
      setIsLoadingConversation(true)

      try {
        const response = await fetch(
          `/api/chat?recordingId=${encodeURIComponent(currentRecordingId)}`
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.error || 'Failed to load chat history.'
          )
        }

        if (cancelled) {
          return
        }

        setConversationId(data?.conversationId ?? null)
        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        )
      } catch (err) {
        if (cancelled) {
          return
        }

        console.error('Conversation loading error:', err)

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load chat history.'
        )
      } finally {
        if (!cancelled) {
          setIsLoadingConversation(false)
        }
      }
    }

    loadConversation()

    return () => {
      cancelled = true
    }
  }, [recordingId])

  async function handleTranscribe() {
    if (!file) {
      setError('Please select an audio or video file first.')
      return
    }

    setIsTranscribing(true)
    setSourceType('file')
    clearResults()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Transcription failed.')
      }

      if (!data?.transcript) {
        throw new Error('No transcript was returned.')
      }

      setRecordingId(data?.recording?.id ?? null)
      setRecordingTitle(data?.recording?.title ?? file.name ?? 'Untitled recording')
      setTranscript(data.transcript)

      if (Array.isArray(data?.segments)) {
        setSegments(data.segments)
      } else {
        setSegments([])
      }
    } catch (err) {
      console.error('Transcription error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while transcribing the file.'
      )
    } finally {
      setIsTranscribing(false)
    }
  }

  async function handleTranscribeUrl() {
    const trimmedUrl = url.trim()

    if (!trimmedUrl) {
      setError('Please paste a media URL first.')
      return
    }

    setIsTranscribing(true)
    setSourceType('url')
    clearResults()

    try {
      const response = await fetch('/api/transcribe-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'URL transcription failed.')
      }

      if (!data?.transcript) {
        throw new Error('No transcript was returned from this URL.')
      }

      setRecordingId(data?.recording?.id ?? null)
      setRecordingTitle(data?.recording?.title ?? 'Untitled recording')
      setTranscript(data.transcript)

      if (Array.isArray(data?.segments)) {
        setSegments(data.segments)
      } else {
        setSegments([])
      }

      if (data?.sourceUrl) {
        setUrl(data.sourceUrl)
      }
    } catch (err) {
      console.error('URL transcription error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while transcribing the URL.'
      )
    } finally {
      setIsTranscribing(false)
    }
  }

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError('A transcript is required before analysis.')
      return
    }

    if (!recordingId) {
      setError(
        'This recording has not been saved yet. Please transcribe it first.'
      )
      return
    }

    setIsAnalyzing(true)
    setError('')
    setAnalysis('')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          transcript,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'AI analysis failed.')
      }

      if (!data?.analysis) {
        throw new Error('No analysis was returned.')
      }

      setAnalysis(data.analysis)

      if (data?.recording?.id) {
        setRecordingId(data.recording.id)
      }

      if (data?.recording?.title) {
        setRecordingTitle(data.recording.title)
      }
    } catch (err) {
      console.error('Analysis error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while analyzing the recording.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleStopSpeaking() {
    stopRequested.current = true
    speechRunId.current += 1

    const audio = audioRef.current

    if (audio) {
      const source = audio.currentSrc || audio.src

      audio.pause()
      audio.currentTime = 0

      if (source.startsWith('blob:')) {
        URL.revokeObjectURL(source)
      }

      audioRef.current = null
    }

    setIsSpeaking(false)
    setSpeakingTarget(null)
  }

  async function handleSpeak(text: string) {
    const speechText = text.trim()

    if (!speechText) {
      setError("There is no text available to read aloud.")
      return
    }

    if (speechText.length > 4096) {
      setError(
        "This text is too long to read aloud in one request. Please use a shorter section."
      )
      return
    }

    stopRequested.current = false
    const runId = speechRunId.current + 1
    speechRunId.current = runId

    setIsSpeaking(true)
    setSpeakingTarget('analysis')
    setError("")

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: speechText,
        }),
      })

      if (!response.ok) {
        let message = "Voice generation failed."

        try {
          const data = await response.json()
          message = data?.error || message
        } catch {
          // Keep the default error message.
        }

        throw new Error(message)
      }

      const audioBlob = await response.blob()

      if (!audioBlob.size) {
        throw new Error("No audio was returned.")
      }

      if (
        stopRequested.current ||
        speechRunId.current !== runId
      ) {
        return
      }

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audioRef.current = audio

      await new Promise<void>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          if (audioRef.current === audio) {
            audioRef.current = null
          }

          URL.revokeObjectURL(audioUrl)
        }

        const finish = () => {
          if (settled) return
          settled = true
          cleanup()
          resolve()
        }

        audio.onended = finish

        audio.onpause = () => {
          if (stopRequested.current || speechRunId.current !== runId) {
            finish()
          }
        }

        audio.onerror = () => {
          if (stopRequested.current || speechRunId.current !== runId) {
            finish()
            return
          }

          settled = true
          cleanup()
          reject(new Error("The generated audio could not be played."))
        }

        audio.play().catch((error) => {
          if (stopRequested.current || speechRunId.current !== runId) {
            finish()
            return
          }

          settled = true
          cleanup()
          reject(error)
        })
      })
    } catch (err) {
      if (
        stopRequested.current ||
        speechRunId.current !== runId
      ) {
        return
      }

      console.error("Voice generation error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating speech."
      )
    } finally {
      if (speechRunId.current === runId) {
        setIsSpeaking(false)
        setSpeakingTarget(null)
      }
    }
  }

  function splitSpeechText(text: string, maxLength = 4096) {
    const normalized = text.trim()

    if (!normalized) {
      return []
    }

    const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []
    const chunks: string[] = []
    let current = ""

    for (const sentence of sentences) {
      const part = sentence.trim()

      if (!part) {
        continue
      }

      if ((current + " " + part).trim().length <= maxLength) {
        current = (current + " " + part).trim()
        continue
      }

      if (current) {
        chunks.push(current)
      }

      if (part.length <= maxLength) {
        current = part
        continue
      }

      for (let start = 0; start < part.length; start += maxLength) {
        chunks.push(part.slice(start, start + maxLength).trim())
      }

      current = ""
    }

    if (current) {
      chunks.push(current)
    }

    return chunks.filter(Boolean)
  }

  async function handleSpeakTranscript() {
    const speechChunks = splitSpeechText(transcript)

    if (speechChunks.length === 0) {
      setError("There is no transcript available to read aloud.")
      return
    }

    stopRequested.current = false
    const runId = speechRunId.current + 1
    speechRunId.current = runId

    setIsSpeaking(true)
    setSpeakingTarget('transcript')
    setError("")

    try {
      for (const speechChunk of speechChunks) {
        if (
          stopRequested.current ||
          speechRunId.current !== runId
        ) {
          return
        }

        const response = await fetch("/api/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: speechChunk,
          }),
        })

        if (!response.ok) {
          let message = "Voice generation failed."

          try {
            const data = await response.json()
            message = data?.error || message
          } catch {
            // Keep the default error message.
          }

          throw new Error(message)
        }

        const audioBlob = await response.blob()

        if (!audioBlob.size) {
          throw new Error("No audio was returned.")
        }

        if (
          stopRequested.current ||
          speechRunId.current !== runId
        ) {
          return
        }

        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audioRef.current = audio

        await new Promise<void>((resolve, reject) => {
          let settled = false

          const cleanup = () => {
            if (audioRef.current === audio) {
              audioRef.current = null
            }

            URL.revokeObjectURL(audioUrl)
          }

          const finish = () => {
            if (settled) return
            settled = true
            cleanup()
            resolve()
          }

          audio.onended = finish

          audio.onpause = () => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
            }
          }

          audio.onerror = () => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
              return
            }

            settled = true
            cleanup()
            reject(
              new Error("The generated audio could not be played.")
            )
          }

          audio.play().catch((error) => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
              return
            }

            settled = true
            cleanup()
            reject(error)
          })
        })
      }
    } catch (err) {
      if (
        stopRequested.current ||
        speechRunId.current !== runId
      ) {
        return
      }

      console.error("Transcript voice generation error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while reading the transcript."
      )
    } finally {
      if (speechRunId.current === runId) {
        setIsSpeaking(false)
        setSpeakingTarget(null)
      }
    }
  }

  async function handleSpeakChatAnswer() {
    const latestAssistantMessage =
      [...messages]
        .reverse()
        .find((message) => message.role === "assistant")
        ?.content || chatAnswer

    const speechText = latestAssistantMessage.trim()

    if (!speechText) {
      setError("There is no AI Chat answer available to read aloud.")
      return
    }

    const speechChunks = splitSpeechText(speechText)

    if (speechChunks.length === 0) {
      setError("There is no AI Chat answer available to read aloud.")
      return
    }

    stopRequested.current = false
    const runId = speechRunId.current + 1
    speechRunId.current = runId

    setIsSpeaking(true)
    setSpeakingTarget('chat')
    setError("")

    try {
      for (const speechChunk of speechChunks) {
        if (
          stopRequested.current ||
          speechRunId.current !== runId
        ) {
          return
        }

        const response = await fetch("/api/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: speechChunk,
          }),
        })

        if (!response.ok) {
          let message = "Voice generation failed."

          try {
            const data = await response.json()
            message = data?.error || message
          } catch {
            // Keep the default error message.
          }

          throw new Error(message)
        }

        const audioBlob = await response.blob()

        if (!audioBlob.size) {
          throw new Error("No audio was returned.")
        }

        if (
          stopRequested.current ||
          speechRunId.current !== runId
        ) {
          return
        }

        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audioRef.current = audio

        await new Promise<void>((resolve, reject) => {
          let settled = false

          const cleanup = () => {
            if (audioRef.current === audio) {
              audioRef.current = null
            }

            URL.revokeObjectURL(audioUrl)
          }

          const finish = () => {
            if (settled) return
            settled = true
            cleanup()
            resolve()
          }

          audio.onended = finish

          audio.onpause = () => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
            }
          }

          audio.onerror = () => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
              return
            }

            settled = true
            cleanup()
            reject(
              new Error("The generated audio could not be played.")
            )
          }

          audio.play().catch((error) => {
            if (
              stopRequested.current ||
              speechRunId.current !== runId
            ) {
              finish()
              return
            }

            settled = true
            cleanup()
            reject(error)
          })
        })
      }
    } catch (err) {
      if (
        stopRequested.current ||
        speechRunId.current !== runId
      ) {
        return
      }

      console.error("AI Chat voice generation error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while reading the AI Chat answer."
      )
    } finally {
      if (speechRunId.current === runId) {
        setIsSpeaking(false)
        setSpeakingTarget(null)
      }
    }
  }

async function handleChat() {
    if (!transcript.trim()) {
      setError('A transcript is required before using AI Chat.')
      return
    }

    if (!question.trim()) {
      setError('Please enter a question first.')
      return
    }

    if (!recordingId) {
      setError(
        'This recording has not been saved yet. Please transcribe it first.'
      )
      return
    }

    const currentQuestion = question.trim()

    setIsChatting(true)
    setError('')
    setChatAnswer('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordingId,
          transcript,
          question: currentQuestion,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'AI chat failed.')
      }

      if (!data?.answer) {
        throw new Error('No answer was returned.')
      }

      if (data?.conversationId) {
        setConversationId(data.conversationId)
      }

      if (Array.isArray(data?.messages)) {
        setMessages((previous) => {
          const existingIds = new Set(previous.map((message) => message.id))
          const newMessages = data.messages.filter(
            (message: ChatMessage) => !existingIds.has(message.id)
          )

          return [...previous, ...newMessages]
        })
      } else {
        setChatAnswer(data.answer)
      }

      setQuestion('')
    } catch (err) {
      console.error('Chat error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while asking Vidin.'
      )
    } finally {
      setIsChatting(false)
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0] ?? null

    setFile(selectedFile)

    if (selectedFile) {
      setUrl('')
      setSourceType('file')
    }

    clearResults()
  }

  function handleUrlChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value

    setUrl(value)

    if (value.trim()) {
      setFile(null)
      setSourceType('url')
    }

    clearResults()
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Real-Time Transcription
            </h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Upload an audio or video recording, or paste a media URL.
            Vidin will convert the spoken content into a searchable
            transcript.
          </p>
        </div>

        <div className="space-y-5">
          <label
            htmlFor="vidin-file-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-12 text-center transition hover:bg-muted/50"
          >
            <Upload className="mb-4 h-8 w-8" />

            <span className="text-sm font-medium">
              Click to upload an audio or video file
            </span>

            <span className="mt-1 text-xs text-muted-foreground">
              MP3, WAV, M4A, MP4 and other supported formats
            </span>

            <input
              id="vidin-file-upload"
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="text-sm font-medium">
                Paste a media URL
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                value={url}
                onChange={handleUrlChange}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !isTranscribing &&
                    url.trim()
                  ) {
                    handleTranscribeUrl()
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                disabled={isTranscribing}
              />

              <Button
                type="button"
                onClick={handleTranscribeUrl}
                disabled={isTranscribing || !url.trim()}
                className="shrink-0"
              >
                {isTranscribing && sourceType === 'url' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing URL...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Transcribe URL
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Start with YouTube. TikTok, Instagram and Facebook URL
              support will use the same Vidin pipeline.
            </p>
          </div>
        </div>

        {file && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileAudio className="h-5 w-5 shrink-0" />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="shrink-0"
            >
              {isTranscribing && sourceType === 'file' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Transcribe
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {transcript && (
        <>
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Transcript
                  </h2>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {sourceType === 'url'
                    ? 'Generated from the media URL.'
                    : 'Generated from the uploaded recording.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium">
                  Transcribed
                </span>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    speakingTarget === 'transcript'
                      ? handleStopSpeaking
                      : handleSpeakTranscript
                  }
                  disabled={isSpeaking && speakingTarget !== 'transcript'}
                >
                  {speakingTarget === 'transcript'
                    ? "Stop Reading"
                    : "Read Transcript"}
                </Button>
              </div>

            </div>

            <div className="max-h-[600px] overflow-y-auto p-6">
              {segments.length > 0 ? (
                <div className="space-y-4">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="mb-2 text-xs font-semibold text-muted-foreground">
                        {formatTimestamp(segment.start)} —{' '}
                        {formatTimestamp(segment.end)}
                      </div>

                      <p className="text-sm leading-7">
                        {segment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {transcript}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  AI Analysis
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Let Vidin understand the recording and extract its
                most important information.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Recording
                </>
              )}
            </Button>

            {analysis && (
              <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Vidin Intelligence
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7">
                  {analysis}
                </p>

                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={
                      speakingTarget === 'analysis'
                        ? handleStopSpeaking
                        : () => handleSpeak(analysis)
                    }
                    disabled={isSpeaking && speakingTarget !== 'analysis'}
                  >
                    {speakingTarget === 'analysis'
                      ? "Stop Reading"
                      : "Read Analysis"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  Ask Vidin
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Ask questions about this recording. Vidin will answer
                using the transcript.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isChatting) {
                    handleChat()
                  }
                }}
                placeholder="Ask something about this recording..."
                className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                disabled={isChatting}
              />

              <Button
                type="button"
                onClick={handleChat}
                disabled={isChatting || !question.trim()}
                className="shrink-0"
              >
                {isChatting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </>
                )}
              </Button>
            </div>

            {isLoadingConversation && (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversation...
              </div>
            )}

            {messages.length > 0 && (
              <div className="mt-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-xl border border-border bg-muted/20 p-5"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {message.role === 'user' ? 'You' : 'Vidin'}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {message.content}
                    </p>

                    {message.role === 'assistant' &&
                      message.id ===
                        [...messages]
                          .reverse()
                          .find((item) => item.role === 'assistant')?.id && (
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={
                              speakingTarget === 'chat'
                                ? handleStopSpeaking
                                : handleSpeakChatAnswer
                            }
                            disabled={isSpeaking && speakingTarget !== 'chat'}
                          >
                            {speakingTarget === 'chat'
                              ? 'Stop Reading'
                              : 'Read AI Chat Answer'}
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            {chatAnswer && messages.length === 0 && (
              <div className="mt-6 rounded-xl border border-border bg-muted/20 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquareText className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Vidin
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7">
                  {chatAnswer}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default InsightVaultDemo
