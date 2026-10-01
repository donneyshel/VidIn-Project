import Link from 'next/link'
import { ArrowUpRight, Waves } from 'lucide-react'

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
    <footer className="relative isolate overflow-hidden border-t border-white/[0.08] bg-[#0b0a12] text-white">
      {/* Final Vidin signal horizon */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[620px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9b7cff]/[0.09] blur-[120px]" />
        <div className="absolute right-[-12%] top-[28%] h-[420px] w-[420px] rounded-full bg-[#62dcff]/[0.055] blur-[110px]" />
        <div className="absolute left-[-12%] bottom-[-10%] h-[420px] w-[420px] rounded-full bg-[#ffc06a]/[0.045] blur-[110px]" />

        {/* Monumental signal rings */}
        <div className="absolute left-1/2 top-[-270px] h-[560px] w-[980px] -translate-x-1/2 rounded-[50%] border border-[#9b7cff]/[0.10]" />
        <div className="absolute left-1/2 top-[-225px] h-[470px] w-[820px] -translate-x-1/2 rounded-[50%] border border-[#62dcff]/[0.07]" />
        <div className="absolute left-1/2 top-[-180px] h-[380px] w-[660px] -translate-x-1/2 rounded-[50%] border border-white/[0.055]" />

        {/* Architectural horizon */}
        <div className="absolute inset-x-0 top-[31%] h-px bg-gradient-to-r from-transparent via-[#9b7cff]/20 to-transparent" />
        <div className="absolute inset-x-0 top-[31.5%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* Vertical signal architecture */}
        <div className="absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-[#9b7cff]/10 to-transparent" />
        <div className="absolute left-[24%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.035] to-transparent" />
        <div className="absolute right-[24%] top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.035] to-transparent" />
        <div className="absolute right-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-[#62dcff]/10 to-transparent" />

        {/* Living signal */}
        <div className="absolute left-1/2 top-[31%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c2b5ff] shadow-[0_0_35px_8px_rgba(155,124,255,0.25)]" />
        <div className="absolute left-1/2 top-[31%] size-8 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-[#9b7cff]/20" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        {/* Final world statement */}
        <div className="relative min-h-[430px] border-b border-white/[0.08] pb-16 pt-20 sm:pt-28">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.035]">
                <Waves className="size-4 text-[#c2b5ff]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">
                Vidin / Final signal
              </span>
            </div>

            <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-white/25 sm:block">
              Signal / Meaning / Action
            </span>
          </div>

          <div className="absolute bottom-14 left-0 right-0">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
              The media is already moving.
            </p>

            <h2 className="max-w-6xl text-balance text-[clamp(4rem,11vw,10.5rem)] font-medium leading-[0.78] tracking-[-0.075em]">
              Now you can
              <br />
              <span className="text-white/30">see it.</span>
            </h2>
          </div>
        </div>

        {/* Navigation system */}
        <div className="grid gap-14 py-16 sm:py-20 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#0b0a12] transition-transform duration-300 group-hover:rotate-6">
                <Waves className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-[-0.03em]">Vidin</span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/40">
              Real-time media transcription and AI intelligence for anyone who needs to
              understand what was said — the moment it&apos;s said.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-[#62dcff] shadow-[0_0_10px_rgba(98,220,255,0.8)]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                Signal status: nominal
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
                {col.title}
              </h3>

              <ul className="mt-5 flex flex-col gap-3.5">
                {col.links.map((link, i) => (
                  <li key={`${col.title}-${i}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3 opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* System footer */}
        <div className="flex flex-col gap-4 border-t border-white/[0.08] py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Vidin Labs, Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
              Real-time media intelligence
            </span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
              Sample rate: 192kHz / 32-bit
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
