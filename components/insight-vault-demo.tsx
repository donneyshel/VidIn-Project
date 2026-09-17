'use client'

import { useState } from 'react'
import {
  FileAudio,
  FileText,
  Loader2,
  Upload,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InsightVaultDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState('')

  async function handleTranscribe() {
    if (!file) {
      setError('Please select an audio or video file first.')
      return
    }

    setIsTranscribing(true)
    setError('')
    setTranscript('')

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

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0] ?? null

    setFile(selectedFile)
    setTranscript('')
    setError('')
  }

  return (
    <section className="space-y-8">
      {/* Upload area */}
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

        {/* Selected file */}
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

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-5">
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

            <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
              Transcribed
            </span>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-6">
            <p className="whitespace-pre-wrap text-sm leading-7">
              {transcript}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default InsightVaultDemo
