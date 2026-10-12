import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import { buildTranscriptChunks } from "@/lib/transcript-chunks"
import { processUploadedVideo } from "@/lib/video/process-uploaded-video"
import { saveVisualMemory } from "@/lib/video/save-visual-memory"
import { probeUploadDuration } from "@/lib/video/probe-upload-duration"
import {
  reserveProcessingUsageWithClaim,
  completeProcessingUsage,
  cleanupFailedProcessing,
  heartbeatProcessingUsage,
} from "@/lib/billing/usage"


export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be signed in to transcribe media." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file was provided." },
        { status: 400 }
      )
    }

    const requestKey = formData.get("requestKey")

    if (
      typeof requestKey !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing processing request ID." },
        { status: 400 }
      )
    }

    let durationSeconds: number

    try {
      durationSeconds = await probeUploadDuration(file)
    } catch (error) {
      return NextResponse.json(
        {
          error: "Unable to determine uploaded media duration.",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 400 }
      )
    }

    let reservation

    try {
      const claim = await reserveProcessingUsageWithClaim(
        user.id,
        durationSeconds,
        requestKey,
      )

      reservation = claim.reservation

      if (!claim.created) {
        if (reservation.status === "completed" && reservation.recording_id) {
          const { data: existingRecording, error: recoveryError } =
            await supabase
              .from("recordings")
              .select("*")
              .eq("id", reservation.recording_id)
              .eq("user_id", user.id)
              .single()

          if (recoveryError || !existingRecording) {
            return NextResponse.json(
              {
                error: "Processing completed, but the saved recording could not be loaded.",
                code: "RECORDING_RECOVERY_FAILED",
                recordingId: reservation.recording_id,
              },
              { status: 409 }
            )
          }

          return NextResponse.json({
            success: true,
            recovered: true,
            transcript: existingRecording.transcript,
            segments: existingRecording.segments ?? [],
            recording: existingRecording,
          })
        }

        return NextResponse.json(
          {
            error:
              reservation.status === "completed"
                ? "This recording has already been processed. Open it from your recordings."
                : reservation.status === "refunded"
                  ? "This processing attempt was refunded. Select the file again to start a new attempt."
                  : "This recording is already being processed. Please wait before retrying.",
            code:
              reservation.status === "completed"
                ? "PROCESSING_ALREADY_COMPLETED"
                : reservation.status === "refunded"
                  ? "PROCESSING_ALREADY_REFUNDED"
                  : "PROCESSING_IN_PROGRESS",
            recordingId: reservation.recording_id,
          },
          { status: 409 }
        )
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "INSUFFICIENT_PROCESSING_BALANCE"
      ) {
        return NextResponse.json(
          {
            error: "Insufficient processing credits.",
            code: "INSUFFICIENT_PROCESSING_BALANCE",
            requiredSeconds: durationSeconds,
          },
          { status: 402 }
        )
      }

      throw error
    }

    let chargeCompleted = false
    let recordingId: string | null = null

    let heartbeatInFlight = false

    const heartbeatTimer = setInterval(() => {
      if (heartbeatInFlight) return

      heartbeatInFlight = true

      void heartbeatProcessingUsage(reservation.id)
        .catch((heartbeatError) => {
          console.error("CRITICAL: Processing heartbeat failed:", {
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
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })

    const segments = transcription.segments ?? []

    const title = file.name
      ? file.name.replace(/\.[^/.]+$/, "")
      : "Untitled recording"

    const { data: recording, error: saveError } = await supabase
      .from("recordings")
      .insert({
        user_id: user.id,
        title,
        source_type: "upload",
        source_url: null,
        transcript: transcription.text,
        segments,
        duration_seconds:
          typeof transcription.duration === "number"
            ? transcription.duration
            : null,
      })
      .select()
      .single()

    if (saveError) {
      console.error("Recording save error:", saveError)

      throw new Error(
        `Transcription succeeded, but recording save failed: ${saveError.message}`
      )
    }

    recordingId = recording.id

    const chunks = buildTranscriptChunks(segments)

    if (chunks.length > 0) {
      const { error: chunkError } = await supabase
        .from("transcript_chunks")
        .insert(
          chunks.map((chunk) => ({
            recording_id: recording.id,
            user_id: user.id,
            ...chunk,
          }))
        )

      if (chunkError) {
        console.error("Transcript chunk save error:", chunkError)

        throw new Error(
          `Transcript chunks could not be saved: ${chunkError.message}`
        )
      }
    }



      try {
        await completeProcessingUsage(reservation.id, recording.id)
        chargeCompleted = true
      } catch (completionError) {
        console.error("CRITICAL: Billing completion requires reconciliation:", {
          reservationId: reservation.id,
          recordingId: recording.id,
          completionError,
        })

        throw new Error(
          "Recording saved, but billing confirmation is pending. Do not retry this upload yet."
        )
      }

    let visualEvents: { timestamp: number; eventType: "on_screen_text" | "slide" | "scene" | "action" | "object" | "visual_description"; content: string }[] = []

      if (file.type.startsWith("video/")) {
        try {
          visualEvents = await processUploadedVideo(file)

          await saveVisualMemory(
            recording.id,
            user.id,
            visualEvents
          )
        } catch (visualError) {
          console.error("Visual pipeline error:", visualError)
        }
      }

      return NextResponse.json({
        success: true,
        transcript: transcription.text,
        segments,
        recording,
      })
    } catch (error) {
      if (!chargeCompleted) {
        try {
          const cleanupResult = await cleanupFailedProcessing(
            reservation.id,
            recordingId
          )

          console.log("Upload processing cleanup result:", {
            reservationId: reservation.id,
            recordingId,
            status: cleanupResult.status,
          })
        } catch (cleanupError) {
          console.error("CRITICAL: Atomic upload cleanup failed:", {
            reservationId: reservation.id,
            recordingId,
            cleanupError,
          })
        }
      }

      throw error
    } finally {
      clearInterval(heartbeatTimer)
    }


  } catch (error) {
    console.error("Transcription error:", error)

    return NextResponse.json(
      {
        error: "Transcription failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
