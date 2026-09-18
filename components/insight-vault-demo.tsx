'use client'

import { useState } from 'react'
import {
  FileAudio,
  FileText,
  Loader2,
  Upload,
  Sparkles,
  Brain,
  MessageSquareText,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InsightVaultDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [question, setQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [error, setError] = useState('')

  async function handleTranscribe() {
    if (!file) {
      setError('Please select an audio or video file first.')
      return
    }

    setIsTranscribing(true)
    setError('')
    setTranscript('')
    setAnalysis('')
    setQuestion('')
    setChatAnswer('')

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

      setTranscript(data.transcript)
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

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError('A transcript is required before analysis.')
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

  async function handleChat() {
    if (!transcript.trim()) {
      setError('A transcript is required before using AI Chat.')
      return
    }

    if (!question.trim()) {
      setError('Please enter a question first.')
      return
    }

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
          transcript,
          question,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'AI chat failed.')
      }

      if (!data?.answer) {
        throw new Error('No answer was returned.')
      }

      setChatAnswer(data.answer)
    } catch (err) {
      console.error('Chat error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while asking VidIn.'
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
    setTranscript('')
    setAnalysis('')
    setQuestion('')
    setChatAnswer('')
    setError('')
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
            Upload an audio or video recording and Vidin will convert
            the spoken content into a searchable transcript.
          </p>
        </div>

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

        {file && (
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
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
              {isTranscribing ? (
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
                  Generated from the uploaded recording.
                </p>
              </div>

              <span className="w-fit rounded-full border border-border px-3 py-1 text-xs font-medium">
                Transcribed
              </span>
            </div>

            <div className="max-h-[600px] overflow-y-auto p-6">
              <p className="whitespace-pre-wrap text-sm leading-7">
                {transcript}
              </p>
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
                using the transcript you uploaded.
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

            {chatAnswer && (
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
