import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { WorkspaceSettings } from '@/components/workspace-settings'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Settings — Workspace — Vidin',
  description: 'Manage your Vidin profile and workspace preferences.',
}

type Appearance = 'dark' | 'light' | 'system'
type Accent = 'violet' | 'blue' | 'cyan' | 'green' | 'amber' | 'rose'

const validAppearances: Appearance[] = ['dark', 'light', 'system']
const validAccents: Accent[] = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'rose',
]

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const rawAppearance = user.user_metadata?.vidin_appearance
  const rawAccent = user.user_metadata?.vidin_accent

  const appearance: Appearance = validAppearances.includes(rawAppearance)
    ? rawAppearance
    : 'dark'

  const accent: Accent = validAccents.includes(rawAccent)
    ? rawAccent
    : 'violet'

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Account
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Personalize your profile and make the Vidin workspace feel like yours.
        </p>
      </div>

      <WorkspaceSettings
        initialName={name}
        email={user.email ?? ''}
        initialAppearance={appearance}
        initialAccent={accent}
      />
    </div>
  )
}
