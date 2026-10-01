import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { createClient } from '@/lib/supabase/server'
import { buildTranscriptChunks } from '@/lib/transcript-chunks'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const execFileAsync = promisify(execFile)

function getYtDlpPath() {
  return path.join(
    process.cwd(),
    'node_modules',
    '.pnpm',
    'youtube-dl-exec@3.1.14_debug@4.4.3',
    'node_modules',
    'youtube-dl-exec',
    'bin',
    'yt-dlp'
  )
}

export async function POST(request: Request) {
  let tempDir = ''

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to transcribe a media URL.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const url = typeof body?.url === 'string' ? body.url.trim() : ''

    if (!url) {
      return NextResponse.json(
        { error: 'A media URL is required.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Please provide a valid URL.' },
        { status: 400 }
      )
    }

    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'vidin-url-')
    )

    const audioPath = path.join(
      tempDir,
      `${crypto.randomUUID()}.mp3`
    )

    const ytDlpPath = getYtDlpPath()
    const cookiesPath = path.join(process.cwd(), 'cookies.txt')

    await fs.access(ytDlpPath)

    const ytDlpArgs = [
      '--extract-audio',
      '--audio-format',
      'mp3',
      '--audio-quality',
      '0',
      '--no-playlist',
      '--no-warnings',
      '--prefer-free-formats',
    ]

    try {
      await fs.access(cookiesPath)
      ytDlpArgs.push('--cookies', cookiesPath)
    } catch {
      // No local cookies file; continue without authentication.
    }

    ytDlpArgs.push(
      '--output',
      audioPath,
      url,
    )

    await execFileAsync(
      ytDlpPath,
      ytDlpArgs,
      {
        maxBuffer: 10 * 1024 * 1024,
      }
    )

    const audio = await fs.readFile(audioPath)

    if (audio.length === 0) {
      throw new Error('The extracted audio file is empty.')
    }

    const audioFile = new File(
      [audio],
      'vidin-url-audio.mp3',
      { type: 'audio/mpeg' }
    )

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    const segments = Array.isArray(transcription.segments)
      ? transcription.segments.map((segment, index) => ({
          id: index,
          start: segment.start,
          end: segment.end,
          text: segment.text,
        }))
      : []

    const title =
      (() => {
        try {
          return new URL(url).hostname
        } catch {
          return 'URL recording'
        }
      })()

    const durationSeconds =
      typeof transcription.duration === 'number'
        ? transcription.duration
        : null

    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        title,
        source_type: 'url',
        source_url: url,
        transcript: transcription.text,
        segments,
        duration_seconds: durationSeconds,
      })
      .select()
      .single()

    if (recordingError) {
      console.error('URL recording save error:', recordingError)

      return NextResponse.json(
        { error: recordingError.message },
        { status: 500 }
      )
    }

    const chunks = buildTranscriptChunks(segments)

    if (chunks.length > 0) {
      const { error: chunkError } = await supabase
        .from('transcript_chunks')
        .insert(
          chunks.map((chunk) => ({
            recording_id: recording.id,
            user_id: user.id,
            ...chunk,
          }))
        )

      if (chunkError) {
        console.error('URL transcript chunk save error:', chunkError)

        return NextResponse.json(
          {
            error: 'Recording was saved, but transcript chunks could not be saved.',
            details: chunkError.message,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments,
      sourceUrl: url,
      recording,
    })
  } catch (error) {
    console.error('URL transcription error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to transcribe the media URL.',
      },
      { status: 500 }
    )
  } finally {
    if (tempDir) {
      try {
        await fs.rm(tempDir, {
          recursive: true,
          force: true,
        })
      } catch (cleanupError) {
        console.error(
          'Temporary media cleanup error:',
          cleanupError
        )
      }
    }
  }
}
