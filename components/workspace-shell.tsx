'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Activity,
  BarChart3,
  CreditCard,
  FolderOpen,
  Home,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Upload,
  Waves,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type WorkspaceShellProps = {
  children: React.ReactNode
  user: {
    email: string
    name: string
  }
}

const navigation = [
  {
    label: 'Workspace',
    items: [
      { href: '/workspace', label: 'Overview', icon: Home },
      { href: '/workspace/library', label: 'Library', icon: FolderOpen },
    ],
  },
  {
    label: 'Products',
    items: [
      { href: '/workspace/insight-vault', label: 'Insight Vault', icon: Sparkles },
      { href: '/workspace/creators-vault', label: 'Creators Vault', icon: BarChart3 },
      { href: '/workspace/live-ecosystem', label: 'Live Ecosystem', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/workspace/usage', label: 'Usage', icon: BarChart3 },
      { href: '/workspace/billing', label: 'Billing', icon: CreditCard },
      { href: '/workspace/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function WorkspaceShell({
  children,
  user,
}: WorkspaceShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    router.push('/auth')
    router.refresh()
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          href="/workspace"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Waves className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Vidin
          </span>
        </Link>
      </div>

      <div className="p-4">
        <Link
          href="/workspace/insight-vault"
          onClick={() => setMobileOpen(false)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Upload className="size-4" />
          New Media
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navigation.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {section.label}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active =
                  item.href === '/workspace'
                    ? pathname === '/workspace'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:opacity-50"
        >
          <LogOut className="size-4" />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative z-10 flex h-full">
            {sidebar}

            <button
              type="button"
              aria-label="Close workspace menu"
              onClick={() => setMobileOpen(false)}
              className="absolute left-68 top-4 rounded-lg border border-border bg-card p-2"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open workspace menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="hidden text-sm text-muted-foreground sm:block">
              Workspace
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                Personal workspace
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold">
              {initials}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
