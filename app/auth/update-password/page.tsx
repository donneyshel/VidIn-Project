'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setMessage(
          'This password reset link is invalid or has expired. Please request a new one.'
        )
      }

      setCheckingSession(false)
    }

    checkSession()
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 6) {
      setMessage('Your new password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('The passwords do not match.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    router.push('/workspace')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Vidin
          </p>

          <h1 className="mt-3 text-3xl font-semibold">
            Create a new password
          </h1>

          <p className="mt-2 text-muted-foreground">
            Choose a new password for your Vidin account.
          </p>
        </div>

        {checkingSession ? (
          <p className="text-sm text-muted-foreground">
            Verifying your reset session...
          </p>
        ) : message &&
          message.includes('invalid or has expired') ? (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{message}</p>

            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background"
            >
              Return to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium"
              >
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>

            {message && (
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  )
}
