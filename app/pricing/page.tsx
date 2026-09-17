import type { Metadata } from 'next'
import { Check, Minus } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { CreditCalculator } from '@/components/credit-calculator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Pay-As-You-Go & Pricing — Vidin',
  description:
    'Transparent per-minute credits at $0.05/min, plus three monthly Vault subscriptions: Insight, Creators and Live Ecosystem.',
}

const plans = [
  { key: 'insight', name: 'Insight Vault', price: '$8.99', audience: 'Students & researchers', featured: false },
  { key: 'creators', name: 'Creators Vault', price: '$68.99', audience: 'Editors & agencies', featured: true },
  { key: 'live', name: 'Live Ecosystem', price: '$128.99', audience: 'Traders & investors', featured: false },
] as const

type PlanKey = (typeof plans)[number]['key']

const rows: { label: string; values: Record<PlanKey, boolean | string> }[] = [
  { label: 'Real-time transcription', values: { insight: true, creators: true, live: true } },
  { label: 'Interactive transcripts', values: { insight: true, creators: true, live: true } },
  { label: 'AI chat over content', values: { insight: true, creators: true, live: true } },
  { label: 'PDF & Markdown export', values: { insight: true, creators: true, live: true } },
  { label: 'Dead content detection', values: { insight: false, creators: true, live: false } },
  { label: 'Viral hook extractor', values: { insight: false, creators: true, live: false } },
  { label: 'Live audio terminal', values: { insight: false, creators: false, live: true } },
  { label: 'Macro prediction engine', values: { insight: false, creators: false, live: true } },
  { label: 'Monthly minutes', values: { insight: '600', creators: '3,000', live: 'Unlimited' } },
  { label: 'Support', values: { insight: 'Email', creators: 'Priority', live: 'Dedicated' } },
]

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-foreground">{value}</span>
  }
  return value ? (
    <Check className="mx-auto size-4 text-chart-2" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/50" />
  )
}

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-14 pt-36 text-center sm:pt-44">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_55%_55%_at_50%_0%,rgba(255,255,255,0.07),transparent)]" />
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Pay-as-you-go &amp; subscriptions</SectionLabel>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Pricing that scales with how you listen.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Start with flexible per-minute credits, or unlock a purpose-built Vault with a monthly
            subscription. Switch or cancel any time.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Pay-As-You-Go calculator</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              $0.05 / minute
            </span>
          </div>
          <CreditCalculator />
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Compare the three Vaults
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              Every plan includes the real-time transcription core. Choose the tools built for you.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-1/3 p-4 text-left align-bottom">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Features
                    </span>
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.key} className="p-4 align-bottom">
                      <div
                        className={cn(
                          'flex flex-col items-center gap-1 rounded-2xl border p-4',
                          plan.featured
                            ? 'border-white/20 bg-secondary glow-border'
                            : 'border-border bg-card',
                        )}
                      >
                        {plan.featured && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-widest text-primary-foreground">
                            Popular
                          </span>
                        )}
                        <span className="text-sm font-semibold">{plan.name}</span>
                        <span className="text-2xl font-semibold tracking-tight">{plan.price}</span>
                        <span className="text-[0.7rem] text-muted-foreground">per month</span>
                        <span className="mt-1 text-xs text-muted-foreground">{plan.audience}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.label} className={ri % 2 === 1 ? 'bg-card/40' : ''}>
                    <td className="border-t border-border p-4 text-sm text-muted-foreground">
                      {row.label}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.key} className="border-t border-border p-4 text-center">
                        <Cell value={row.values[plan.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4" />
                  {plans.map((plan) => (
                    <td key={plan.key} className="p-4 text-center">
                      <Button
                        variant={plan.featured ? 'default' : 'outline'}
                        className="w-full rounded-xl"
                      >
                        Subscribe
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-4 pb-28">
        <div className="glass-card glow-border mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-3xl px-6 py-14 text-center">
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight">
            Not sure which plan fits? Start pay-as-you-go.
          </h2>
          <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
            Buy credits, try every core feature, and upgrade to a Vault whenever you are ready.
          </p>
          <Button className="rounded-xl px-6" size="lg">
            Get Started for $0.05/min
          </Button>
        </div>
      </section>
    </>
  )
}
