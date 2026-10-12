import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Clock, Sparkles, Video, Radio } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { CreditCalculator } from '@/components/credit-calculator'

export const metadata: Metadata = {
  title: 'Pay-As-You-Go & Pricing — Vidin',
  description:
    'Start with 10 free seconds every day, then pay $0.09 USD per minute. Creators Vault and Live Ecosystem are coming later.',
}

const subscriptions = [
  {
    name: 'Creators Vault',
    price: '$29.99',
    audience: 'Editors · Influencers · Agencies',
    description:
      'Unlock creator-focused intelligence built to find stronger moments, improve retention and turn long-form content into high-impact output.',
    Icon: Video,
    features: [
      'Dead content detection',
      'Viral hook extraction',
      'Platform-tuned output',
      'Creator-focused intelligence',
    ],
    href: '/creators-vault',
    featured: true,
  },
  {
    name: 'Live Ecosystem',
    price: '$49.99',
    audience: 'Forex · Crypto · Stocks',
    description:
      'Unlock Vidin’s live intelligence environment for real-time audio, market context and signal discovery.',
    Icon: Radio,
    features: [
      'Live audio terminal',
      'Macro prediction engine',
      'Confidence scoring',
      'Real-time market intelligence',
    ],
    href: '/live-ecosystem',
    featured: false,
  },
] as const

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-14 pt-36 text-center sm:pt-44">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(255,255,255,0.07),transparent)]" />

        <div className="mx-auto max-w-3xl">
          <SectionLabel>Simple usage · Premium ecosystems</SectionLabel>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Pay for the minutes you use.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Every Vidin account gets 10 free seconds every day. When you need
            more, buy only the minutes you want at $0.09 USD per minute. Premium
            ecosystems are coming later.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Pay-As-You-Go
                </h2>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Your purchased minutes power the core Vidin experience and
                never expire.
              </p>
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              $0.09 USD / minute
            </span>
          </div>

          <CreditCalculator />

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card/50 p-4">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">10 free seconds every day</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your daily free seconds is available before purchased minutes
                are used.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>Coming Soon</SectionLabel>

            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              More VidIn ecosystems are on the way.
            </h2>

            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              Insight Vault launches first. Creators Vault and Live Ecosystem
              will arrive later as VidIn grows. Premium subscriptions are
              not available for purchase yet.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            {subscriptions.map((plan) => {
              const Icon = plan.Icon

              return (
                <div
                  key={plan.name}
                  className={
                    'relative flex flex-col rounded-3xl border p-7 ' +
                    (plan.featured
                      ? 'glass-card glow-border border-white/20'
                      : 'border-border bg-card')
                  }
                >
                  {plan.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest text-primary-foreground">
                      Coming Soon
                    </span>
                  )}

                  <span className="flex size-11 items-center justify-center rounded-xl bg-secondary">
                    <Icon className="size-5" />
                  </span>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight">
                    {plan.name}
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.audience}
                  </p>

                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight">
                      {plan.price}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">
                      / month
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                    {plan.description}
                  </p>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Check className="size-3" />
                        </span>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8">
                    <Link
                      href={plan.href}
                      className={
                        'inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-medium transition-opacity hover:opacity-90 ' +
                        (plan.featured
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-background')
                      }
                    >
                      {plan.name} — Coming Soon
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mx-auto mt-6 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            Creators Vault and Live Ecosystem are planned future releases.
            No premium subscriptions are being sold during the Insight Vault launch.
          </p>
        </div>
      </section>

      <section className="px-4 pb-28">
        <div className="glass-card glow-border mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center">
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
            Start with 10 free seconds daily. Scale when you need more.
          </h2>

          <p className="max-w-lg text-pretty leading-relaxed text-muted-foreground">
            No Insight Vault subscription and no bundled monthly minutes. Buy
            processing time when you need it. Creators Vault and Live Ecosystem
            will become available in future releases.
          </p>

          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start Using Vidin
          </Link>
        </div>
      </section>
    </>
  )
}
