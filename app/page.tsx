import Link from 'next/link'
import { ArrowRight, GraduationCap, Clapperboard, LineChart, Zap } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { UrlTranscribeBar } from '@/components/url-transcribe-bar'

const vaults = [
  {
    href: '/insight-vault',
    Icon: GraduationCap,
    name: 'Insight Vault',
    price: '$8.99/mo',
    audience: 'Students, researchers & casual listeners',
    desc: 'Interactive transcripts, an AI chat that answers questions about any recording, and one-click exports to PDF or Markdown.',
  },
  {
    href: '/creators-vault',
    Icon: Clapperboard,
    name: 'Creators Vault',
    price: '$68.99/mo',
    audience: 'Video editors, influencers & agencies',
    desc: 'Dead-content detection that flags retention drop-offs and a viral hook extractor tuned for Reels, Shorts and TikTok.',
  },
  {
    href: '/live-ecosystem',
    Icon: LineChart,
    name: 'Live Ecosystem',
    price: '$128.99/mo',
    audience: 'Forex, crypto & stock investors',
    desc: 'A live audio terminal streaming financial news to text, with a macro prediction engine matching todays signals to history.',
  },
  {
    href: '/pricing',
    Icon: Zap,
    name: 'Pay-As-You-Go',
    price: '$0.05/min',
    audience: 'Occasional & high-volume teams',
    desc: 'No subscription required. Pay only for the minutes you transcribe with transparent, per-minute credit pricing.',
  },
]

const stats = [
  { value: '99.2%', label: 'Transcription accuracy' },
  { value: '<800ms', label: 'Live stream latency' },
  { value: '40+', label: 'Languages supported' },
  { value: '12M+', label: 'Minutes processed' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-36 sm:pt-44">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <SectionLabel>Real-time media intelligence</SectionLabel>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Extract Real-Time Intelligence From Any Media Stream.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Vidin turns any video or audio link into an accurate, searchable transcript — then
            layers AI analysis on top so you understand the signal the instant it happens.
          </p>
          <div className="mt-10 w-full">
            <UrlTranscribeBar />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-8 text-center">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.value}</p>
              <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Vault teasers */}
      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <SectionLabel>Three vaults, one engine</SectionLabel>
            <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Purpose-built intelligence for the way you work.
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Every vault runs on the same real-time transcription core, tuned with tools for a
              specific audience. Explore each one below.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {vaults.map(({ href, Icon, name, price, audience, desc }) => (
              <Link
                key={name}
                href={href}
                className="glass-card group flex flex-col rounded-2xl p-6 transition-colors hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {price}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{name}</h3>
                <p className="mt-1 text-xs font-medium text-chart-2">{audience}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  Explore Vault
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-28">
        <div className="glass-card glow-border mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-6 py-16 text-center">
          <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Start extracting intelligence in seconds.
          </h2>
          <p className="max-w-lg text-pretty leading-relaxed text-muted-foreground">
            Paste a link, pick a vault, and let Vidin do the listening. No credit card required to
            try your first transcript.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
            <Link
              href="/insight-vault"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-secondary px-6 text-sm font-medium text-foreground transition-colors hover:border-white/20"
            >
              See a live demo
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
