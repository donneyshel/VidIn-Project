import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build the future with VidIn | VidIn',
  description: "We're building technology that changes how people understand media.",
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0a12] px-5 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-16 inline-block text-sm text-[#c2b5ff] hover:text-white">
          ← Back to VidIn
        </Link>

        <p className="mb-5 font-mono text-xs tracking-[0.3em] text-[#c2b5ff]">
          CAREERS
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Build the future with VidIn
        </h1>

        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          We're building technology that changes how people understand media.
        </p>

        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Our vision</h2>
          <p className="leading-8 text-white/55">We're interested in thoughtful technology, practical innovation, and making powerful AI tools accessible through simple experiences.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Working at VidIn</h2>
          <p className="leading-8 text-white/55">As VidIn grows, we aim to bring together people who care about engineering, design, product development, and the future of media intelligence.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Current opportunities</h2>
          <p className="leading-8 text-white/55">We don't have any publicly advertised positions at this time. Check this page for future opportunities as the company develops.</p>
        </section>
        </div>
      </div>
    </main>
  )
}
