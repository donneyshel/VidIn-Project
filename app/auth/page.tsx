'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup' | 'forgot'

export default function AuthPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('signin')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'If an account exists for that email, a password reset link has been sent.'
        )
      }

      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(
          'Account created. Check your email if confirmation is required.'
        )
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(error.message)
      } else {
        window.location.href = '/workspace'
      }
    }

    setLoading(false)
  }

  async function handleOAuth(provider: 'google' | 'apple' | 'x') {
    setOauthLoading(provider)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
      setOauthLoading(null)
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setMessage('')
    setPassword('')
  }

  const isForgot = mode === 'forgot'

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Vidin
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            {mode === 'signin'
              ? 'Welcome back'
              : mode === 'signup'
                ? 'Create your account'
                : 'Reset your password'}
          </h1>

          <p className="mt-2 text-muted-foreground">
            {mode === 'signin'
              ? 'Sign in to continue to your Insight Vault.'
              : mode === 'signup'
                ? 'Create your Vidin account to start building your Insight Vault.'
                : 'Enter your email and we will send you a secure password reset link.'}
          </p>
        </div>

        {!isForgot && (
          <>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={oauthLoading !== null || loading}
                className="w-full rounded-lg border border-border px-4 py-3 font-medium disabled:opacity-50"
              >
                {oauthLoading === 'google'
                  ? 'Connecting...'
                  : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={oauthLoading !== null || loading}
                className="w-full rounded-lg border border-border px-4 py-3 font-medium disabled:opacity-50"
              >
                {oauthLoading === 'apple'
                  ? 'Connecting...'
                  : 'Continue with Apple'}
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('x')}
                disabled={oauthLoading !== null || loading}
                className="w-full rounded-lg border border-border px-4 py-3 font-medium disabled:opacity-50"
              >
                {oauthLoading === 'x'
                  ? 'Connecting...'
                  : 'Continue with X'}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none"
              placeholder="you@example.com"
            />
          </div>

          {!isForgot && (
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || oauthLoading !== null}
            className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>

        {message && (
          <p className="mt-5 text-sm text-muted-foreground">
            {message}
          </p>
        )}

        {mode === 'signin' && (
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className="mt-5 text-sm underline underline-offset-4"
          >
            Forgot your password?
          </button>
        )}

        <div className="mt-6">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-sm underline underline-offset-4"
            >
              Back to sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                switchMode(mode === 'signin' ? 'signup' : 'signin')
              }
              className="text-sm underline underline-offset-4"
            >
              {mode === 'signin'
                ? 'Need an account? Create one'
                : 'Already have an account? Sign in'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
