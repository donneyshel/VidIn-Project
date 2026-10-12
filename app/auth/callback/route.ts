import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const publicOrigin =
    process.env.NODE_ENV === 'production'
      ? 'https://vidin.pro'
      : requestUrl.origin

  const code = requestUrl.searchParams.get('code')
  const requestedNext = requestUrl.searchParams.get('next')

  const allowedNext =
    requestedNext === '/auth/update-password'
      ? '/auth/update-password'
      : '/workspace'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(
        new URL(allowedNext, publicOrigin)
      )
    }
  }

  return NextResponse.redirect(
    new URL('/auth?error=auth_callback_failed', publicOrigin)
  )
}
