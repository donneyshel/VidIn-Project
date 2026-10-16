import { getVideoMetadata } from '@/lib/video/get-video-metadata'
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
import { processVideoVision } from '@/lib/video/process-video-vision'
import { downloadVideo } from '@/lib/video/download-video'
import { saveVisualMemory } from '@/lib/video/save-visual-memory'
import {
  reserveProcessingUsageWithClaim,
  completeProcessingUsage,
  cleanupFailedProcessing,
  heartbeatProcessingUsage,
} from '@/lib/billing/usage'
import { probeMediaDuration } from '@/lib/video/probe-media-duration'
import { getYtDlpPath } from '@/lib/video/yt-dlp-path'


const execFileAsync = promisify(execFile)



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

    const requestKey =
      typeof body?.requestKey === 'string'
        ? body.requestKey
        : ''

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
    ) {
      return NextResponse.json(
        { error: 'A valid processing request ID is required.' },
        { status: 400 }
      )
    }


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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    const videoPath = path.join(tempDir, 'source.mp4')

    const downloadedPath = await downloadVideo(url, videoPath)

    await execFileAsync('ffmpeg', [
      '-y',
      '-i', downloadedPath,
      '-vn',
      '-codec:a', 'libmp3lame',
      '-qscale:a', '4',
      audioPath,
    ], { maxBuffer: 10 * 1024 * 1024 })

    const durationSeconds = await probeMediaDuration(audioPath)

    let claim

    try {
      claim = await reserveProcessingUsageWithClaim(
        user.id,
        durationSeconds,
        requestKey
      )
    } catch (billingError) {
      if (
        billingError instanceof Error &&
        billingError.message.includes('INSUFFICIENT_PROCESSING_BALANCE')
      ) {
        return NextResponse.json(
          {
            error: 'Insufficient processing credits.',
            code: 'INSUFFICIENT_PROCESSING_BALANCE',
            requiredSeconds: durationSeconds,
          },
          { status: 402 }
        )
      }

      throw billingError
    }

    const reservation = claim.reservation

    if (!claim.created) {
      if (
        reservation.status === 'completed' &&
        reservation.recording_id
      ) {
        const { data: existingRecording, error: recoveryError } =
          await supabase
            .from('recordings')
            .select('*')
            .eq('id', reservation.recording_id)
            .eq('user_id', user.id)
            .single()

        if (recoveryError || !existingRecording) {
          return NextResponse.json(
            {
              error: 'Previously processed recording could not be loaded.',
              code: 'RECORDING_RECOVERY_FAILED',
            },
            { status: 409 }
          )
        }

        return NextResponse.json({
          success: true,
          recovered: true,
          transcript: existingRecording.transcript,
          segments: existingRecording.segments ?? [],
          sourceUrl: url,
          recording: existingRecording,
        })
      }

      return NextResponse.json(
        {
          error:
            reservation.status === 'reserved'
              ? 'This URL is already being processed.'
              : 'This processing request was previously refunded. Start a new request.',
          code:
            reservation.status === 'reserved'
              ? 'PROCESSING_IN_PROGRESS'
              : 'PROCESSING_REFUNDED',
        },
        { status: 409 }
      )
    }

    let chargeCompleted = false
    let recordingId: string | null = null

    let heartbeatInFlight = false
    const heartbeatTimer = setInterval(() => {
      if (heartbeatInFlight || chargeCompleted) return

      heartbeatInFlight = true

      void heartbeatProcessingUsage(reservation.id)
        .catch((heartbeatError) => {
          console.error('URL processing heartbeat failed:', {
            reservationId: reservation.id,
            heartbeatError,
          })
        })
        .finally(() => {
          heartbeatInFlight = false
        })
    }, 120_000)

    try {
      await heartbeatProcessingUsage(reservation.id)

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

    const metadata = await getVideoMetadata(url).catch((error) => {
      console.warn('Video metadata unavailable:', error)
      return null
    })

    const title = metadata?.title?.trim() || new URL(url).hostname

    const { data: recording, error: recordingError } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        title,
        source_type: 'url',
        source_url: url,
        thumbnail_url: metadata?.thumbnailUrl ?? null,
        source_platform: metadata?.platform ?? null,
        transcript: transcription.text,
        segments,
        duration_seconds: durationSeconds,
      })
      .select()
      .single()

    if (recordingError) {
      console.error('URL recording save error:', recordingError)
      throw new Error(
        `Unable to save URL recording: ${recordingError.message}`
      )
    }

    recordingId = recording.id

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
        throw new Error(
          `Unable to save transcript chunks: ${chunkError.message}`
        )
      }
    }

    await completeProcessingUsage(reservation.id, recording.id)
    chargeCompleted = true
    clearInterval(heartbeatTimer)

    let visualStatus:
      | 'completed'
      | 'no_visual_events'
      | 'failed'
      | 'not_applicable' = 'failed'

    try {
      const { stdout: videoStream } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=index',
        '-of', 'csv=p=0',
        downloadedPath,
      ], {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      })

      if (!videoStream.trim()) {
        visualStatus = 'not_applicable'
      } else {
        const visualEvents = await processVideoVision(downloadedPath)

      await saveVisualMemory(
        recording.id,
        user.id,
        visualEvents
      )

      visualStatus = visualEvents.length > 0
        ? 'completed'
        : 'no_visual_events'

        console.log('URL visual processing result:', {
          recordingId: recording.id,
          visualStatus,
          eventCount: visualEvents.length,
        })
      }
    } catch (visualError) {
      console.error('Visual pipeline error:', {
        recordingId: recording.id,
        visualError,
      })
    }

    console.log('URL TRANSCRIBE: preparing final JSON response', {
      transcriptLength: transcription.text?.length ?? 0,
      segmentCount: segments.length,
      recordingId: recording.id,
    })

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
      segments,
      sourceUrl: url,
      recording,
      visualStatus,
    })
    } catch (processingError) {
      if (!chargeCompleted) {
        try {
          const cleanupResult = await cleanupFailedProcessing(
            reservation.id,
            recordingId
          )

          console.log('URL processing cleanup result:', {
            reservationId: reservation.id,
            status: cleanupResult.status,
            recordingId,
          })
        } catch (cleanupError) {
          console.error('CRITICAL: Atomic URL cleanup failed:', {
            reservationId: reservation.id,
            recordingId,
            cleanupError,
          })
        }
      }

      throw processingError
    } finally {
      clearInterval(heartbeatTimer)
    }

  } catch (error) {
    console.error('URL transcription error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /sign in to confirm you're not a bot|sign in to confirm you.re not a bot|login required|cookies.*authentication/i.test(error.message)
            ? 'YouTube temporarily blocked access to this video. Please upload the video file directly or try another link.'
            : 'Unable to process this media URL. Please try again or upload the file directly.',
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
