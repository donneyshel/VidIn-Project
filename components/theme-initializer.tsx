'use client'

import { useEffect } from 'react'

type Appearance = 'dark' | 'light' | 'system'
type Accent = 'violet' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose'

const appearances = new Set<Appearance>(['dark', 'light', 'system'])
const accents = new Set<Accent>([
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'rose',
])

function resolveAppearance(value: string | null): Appearance {
  return appearances.has(value as Appearance)
    ? (value as Appearance)
    : 'dark'
}

function resolveAccent(value: string | null): Accent {
  return accents.has(value as Accent)
    ? (value as Accent)
    : 'violet'
}

function applyTheme(appearance: Appearance, accent: Accent) {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark =
    appearance === 'dark' || (appearance === 'system' && prefersDark)

  root.dataset.appearance = appearance
  root.dataset.accent = accent
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
}

export function ThemeInitializer() {
  useEffect(() => {
    const appearance = resolveAppearance(
      localStorage.getItem('vidin-appearance'),
    )
    const accent = resolveAccent(
      localStorage.getItem('vidin-accent'),
    )

    applyTheme(appearance, accent)

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemChange = () => {
      const currentAppearance = resolveAppearance(
        localStorage.getItem('vidin-appearance'),
      )

      if (currentAppearance === 'system') {
        applyTheme(currentAppearance, resolveAccent(
          localStorage.getItem('vidin-accent'),
        ))
      }
    }

    media.addEventListener('change', handleSystemChange)

    return () => {
      media.removeEventListener('change', handleSystemChange)
    }
  }, [])

  return null
}
