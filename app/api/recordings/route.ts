import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to save a recording.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const title =
      typeof body?.title === 'string' && body.title.trim()
        ? body.title.trim()
        : 'Untitled recording'

    const sourceType =
      typeof body?.sourceType === 'string' && body.sourceType.trim()
        ? body.sourceType.trim()
        : 'upload'

    const sourceUrl =
      typeof body?.sourceUrl === 'string' && body.sourceUrl.trim()
        ? body.sourceUrl.trim()
        : null

    const transcript =
      typeof body?.transcript === 'string'
        ? body.transcript
        : null

    const segments = Array.isArray(body?.segments)
      ? body.segments
      : []

    const durationSeconds =
      typeof body?.durationSeconds === 'number'
        ? body.durationSeconds
        : null

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        title,
        source_type: sourceType,
        source_url: sourceUrl,
        transcript,
        segments,
        duration_seconds: durationSeconds,
      })
      .select()
      .single()

    if (error) {
      console.error('Recording save error:', error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recording: data,
    })
  } catch (error) {
    console.error('Recording API error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save recording.',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to view your recordings.' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('recordings')
      .select(
        'id, title, source_type, source_url, transcript, segments, duration_seconds, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Recording fetch error:', error)

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recordings: data ?? [],
    })
  } catch (error) {
    console.error('Recording GET API error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load recordings.',
      },
      { status: 500 }
    )
  }
}
