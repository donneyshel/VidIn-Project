'use client'

import { useEffect, useState } from 'react'
import { Check, Monitor, Moon, Palette, Save, Sun, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Appearance = 'dark' | 'light' | 'system'
type Accent = 'violet' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose'

type WorkspaceSettingsProps = {
  initialName: string
  email: string
  initialAppearance: Appearance
  initialAccent: Accent
}

const appearances: {
  value: Appearance
  label: string
  icon: typeof Moon
}[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

const accents: {
  value: Accent
  label: string
  color: string
}[] = [
  { value: 'violet', label: 'Violet', color: '#8b7cff' },
  { value: 'blue', label: 'Blue', color: '#5b8cff' },
  { value: 'cyan', label: 'Cyan', color: '#55d6ff' },
  { value: 'green', label: 'Green', color: '#4ade80' },
  { value: 'amber', label: 'Amber', color: '#ffb45c' },
  { value: 'rose', label: 'Rose', color: '#fb7185' },
]

function applyPreferences(appearance: Appearance, accent: Accent) {
  const root = document.documentElement

  root.dataset.appearance = appearance
  root.dataset.accent = accent

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolvedDark =
    appearance === 'dark' || (appearance === 'system' && prefersDark)

  root.classList.toggle('dark', resolvedDark)
  root.classList.toggle('light', !resolvedDark)
}

export function WorkspaceSettings({
  initialName,
  email,
  initialAppearance,
  initialAccent,
}: WorkspaceSettingsProps) {
  const router = useRouter()

  const [name, setName] = useState(initialName)
  const [appearance, setAppearance] =
    useState<Appearance>(initialAppearance)
  const [accent, setAccent] = useState<Accent>(initialAccent)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    applyPreferences(appearance, accent)
  }, [appearance, accent])

  async function handleSave() {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setMessage('Enter a display name before saving.')
      return
    }

    setSaving(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        vidin_appearance: appearance,
        vidin_accent: accent,
      },
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    localStorage.setItem('vidin-appearance', appearance)
    localStorage.setItem('vidin-accent', accent)

    applyPreferences(appearance, accent)

    setMessage('Settings saved.')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="grid gap-6">
      <section className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
            <UserRound className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Choose how your identity appears inside Vidin.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Display name</span>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
              placeholder="Your name"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>

            <input
              value={email}
              disabled
              className="h-11 rounded-xl border border-input bg-secondary px-3 text-sm text-muted-foreground opacity-80"
            />
          </label>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Palette className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Personalize how your Vidin workspace looks.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-sm font-medium">Theme</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {appearances.map((option) => {
              const Icon = option.icon
              const selected = appearance === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAppearance(option.value)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-[var(--vidin-signal)] bg-secondary'
                      : 'border-border hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="text-sm font-medium">{option.label}</span>

                  {selected && (
                    <Check className="ml-auto size-4 text-[var(--vidin-signal)]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-medium">Accent color</p>

          <div className="flex flex-wrap gap-3">
            {accents.map((option) => {
              const selected = accent === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`${option.label} accent`}
                  title={option.label}
                  onClick={() => setAccent(option.value)}
                  className={`flex size-11 items-center justify-center rounded-full border transition-transform hover:scale-105 ${
                    selected ? 'border-foreground' : 'border-border'
                  }`}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: option.color }}
                  >
                    {selected && (
                      <Check className="size-4 text-black" />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Your accent affects workspace highlights and interactive elements.
            Product identities keep their own colors.
          </p>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {message && (
          <p className="mr-auto text-sm text-muted-foreground">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
