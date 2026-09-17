import type { Metadata } from 'next'
import Link from 'next/link'
import { MousePointerClick, MessageSquareText, FileDown } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { InsightVaultDemo } from '@/components/insight-vault-demo'

export const metadata: Metadata = {
  title: 'Insight Vault — Vidin',
  description:
    'Interactive transcripts with clickable timestamps, an AI chat that answers questions about any recording, and one-click exports.',
}

const features = [
  {
    Icon: MousePointerClick,
    title: 'Clickable timestamps',
    desc: 'Jump to any moment in the recording by clicking a line in the transcript. Perfect for revisiting a tricky explanation.',
  },
  {
    Icon: MessageSquareText,
    title: 'Ask the recording',
    desc: 'A built-in AI chat answers questions about the lecture or video, citing the exact timestamp where the answer lives.',
  },
  {
    Icon: FileDown,
    title: 'One-click exports',
    desc: 'Turn any transcript into polished PDF study sheets or clean Markdown notes for your favorite knowledge base.',
  },
]

export default function InsightVaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="Insight Vault · $8.99/mo"
        title="Turn any recording into a study partner."
        description="Built for students, researchers and casual listeners who want to understand — not just replay — every recording."
        price="$8.99 / month"
        audience="Students · Researchers · Listeners"
      />

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <InsightVaultDemo />
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
            Study smarter for $8.99 a month.
          </h2>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Subscribe to Insight Vault
          </Link>
        </div>
      </section>
    </>
  )
}
