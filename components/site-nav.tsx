'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const links = [
  { href: '/', label: 'Home' },
  { href: '/insight-vault', label: 'Insight Vault' },
  { href: '/creators-vault', label: 'Creators Vault' },
  { href: '/live-ecosystem', label: 'Live Ecosystem' },
  { href: '/pricing', label: 'Pay-As-You-Go & Pricing' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border bg-background/70 px-4 py-2.5 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Waves className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Vidin</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            Sign In
          </Button>
          <Button size="sm" className="rounded-lg" render={<Link href="/pricing" />}>
            Get Started
          </Button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="text-foreground lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-border bg-background/95 p-3 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    active
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button size="sm" render={<Link href="/pricing" onClick={() => setOpen(false)} />}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
