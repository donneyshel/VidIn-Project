import type { Metadata } from 'next'
import Link from 'next/link'
import { Activity, Scissors, Share2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { CreatorsVaultDemo } from '@/components/creators-vault-demo'

export const metadata: Metadata = {
  title: 'Creators Vault — Vidin',
  description:
    'Dead content detection that flags retention drop-offs plus a viral hook extractor tuned for TikTok, Reels and Shorts.',
}

const features = [
  {
    Icon: Activity,
    title: 'Dead content detection',
    desc: 'A retention timeline surfaces the exact moments your video lags so you can cut, tighten, or re-shoot with confidence.',
  },
  {
    Icon: Scissors,
    title: 'Viral hook extractor',
    desc: 'Vidin mines your transcript for the most magnetic lines and turns them into short-form hooks ready to publish.',
  },
  {
    Icon: Share2,
    title: 'Platform-tuned output',
    desc: 'Every soundbite is scored and formatted for TikTok, Instagram Reels and YouTube Shorts algorithms individually.',
  },
]

export default function CreatorsVaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="Creators Vault · $68.99/mo"
        title="Cut the dead weight. Keep them watching."
        description="Built for video editors, influencers and agencies who live or die by retention and shareable moments."
        price="$68.99 / month"
        audience="Editors · Influencers · Agencies"
      />

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <CreatorsVaultDemo />
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
            Ship sharper edits with Creators Vault.
          </h2>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Subscribe to Creators Vault
          </Link>
        </div>
      </section>
    </>
  )
}
