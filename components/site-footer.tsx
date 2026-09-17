import Link from 'next/link'
import { Waves } from 'lucide-react'

const columns = [
  {
    title: 'Product',
    links: [
      { href: '/insight-vault', label: 'Insight Vault' },
      { href: '/creators-vault', label: 'Creators Vault' },
      { href: '/live-ecosystem', label: 'Live Ecosystem' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/', label: 'About' },
      { href: '/', label: 'Careers' },
      { href: '/', label: 'Blog' },
      { href: '/', label: 'Contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/', label: 'Documentation' },
      { href: '/', label: 'API Reference' },
      { href: '/', label: 'Status' },
      { href: '/', label: 'Security' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Vidin</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Real-time media transcription and AI intelligence for anyone who needs to understand
            what was said — the moment it&apos;s said.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Signal status: nominal
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {col.title}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link, i) => (
                <li key={`${col.title}-${i}`}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vidin Labs, Inc. All rights reserved.
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Sample rate: 192kHz / 32-bit
          </p>
        </div>
      </div>
    </footer>
  )
}
