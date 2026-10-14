import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    const requestKey = request.nextUrl.searchParams.get("requestKey")

    if (
      !requestKey ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)
    ) {
      return NextResponse.json(
        { error: "Invalid processing request ID." },
        { status: 400 }
      )
    }

    const { data: reservation, error: reservationError } =
      await supabase
        .from("usage_reservations")
        .select("status, recording_id")
        .eq("user_id", user.id)
        .eq("request_key", requestKey)
        .maybeSingle()

    if (reservationError) {
      console.error("Transcript recovery lookup failed:", reservationError)
      return NextResponse.json(
        { error: "Unable to check processing status." },
        { status: 500 }
      )
    }

    if (!reservation) {
      return NextResponse.json(
        { status: "not_found" },
        { status: 404 }
      )
    }

    if (reservation.status !== "completed") {
      return NextResponse.json({
        status: reservation.status,
        success: false,
      })
    }

    if (!reservation.recording_id) {
      return NextResponse.json(
        {
          status: "completed",
          success: false,
          error: "Processing completed but no recording is linked.",
        },
        { status: 409 }
      )
    }

    const { data: recording, error: recordingError } =
      await supabase
        .from("recordings")
        .select("*")
        .eq("id", reservation.recording_id)
        .eq("user_id", user.id)
        .maybeSingle()

    if (recordingError || !recording) {
      return NextResponse.json(
        {
          status: "completed",
          success: false,
          error: "Completed recording could not be retrieved.",
        },
        { status: 409 }
      )
    }

    if (
      typeof recording.transcript !== "string" ||
      !recording.transcript.trim()
    ) {
      return NextResponse.json(
        {
          status: "completed",
          success: false,
          error: "Completed recording has no available transcript.",
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      recovered: true,
      status: "completed",
      recording,
      transcript: recording.transcript,
      segments: Array.isArray(recording.segments)
        ? recording.segments
        : [],
    })
  } catch (error) {
    console.error("Transcript recovery error:", error)

    return NextResponse.json(
      { error: "Transcript recovery is temporarily unavailable." },
      { status: 500 }
    )
  }
}
