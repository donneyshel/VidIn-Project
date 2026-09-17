import type { Metadata } from 'next'
import Link from 'next/link'
import { Radio, Brain, Gauge } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { LiveEcosystemDemo } from '@/components/live-ecosystem-demo'

export const metadata: Metadata = {
  title: 'Live Ecosystem — Vidin',
  description:
    'A live audio stream terminal and a macro prediction engine matching real-time financial broadcasts to historical market outcomes.',
}

const features = [
  {
    Icon: Radio,
    title: 'Live audio terminal',
    desc: 'Real-time speech-to-text from financial news streams and central-bank pressers, tagged for rate, macro and risk signals as they are spoken.',
  },
  {
    Icon: Brain,
    title: 'Macro prediction engine',
    desc: 'AI pattern-matches live commentary against decades of market history to surface the most comparable past outcomes.',
  },
  {
    Icon: Gauge,
    title: 'Confidence scoring',
    desc: 'Every prediction ships with a transparent confidence score and the historical episode it was matched against.',
  },
]

export default function LiveEcosystemPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live Ecosystem · $128.99/mo"
        title="Trade the words the moment they are spoken."
        description="Built for forex, crypto and stock investors who need macro signals turned into text and context in real time."
        price="$128.99 / month"
        audience="Forex · Crypto · Stocks"
      />

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <LiveEcosystemDemo />
        </div>
      </section>

      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {features.map(({ Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-28">
        <div className="glass-card glow-border mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center">
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
            Never miss a market-moving word again.
          </h2>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Subscribe to Live Ecosystem
          </Link>
        </div>
      </section>
    </>
  )
}
