import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About VidIn | VidIn',
  description: 'Media moves fast. Understanding it should be effortless.',
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0a12] px-5 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-16 inline-block text-sm text-[#c2b5ff] hover:text-white">
          ← Back to VidIn
        </Link>

        <p className="mb-5 font-mono text-xs tracking-[0.3em] text-[#c2b5ff]">
          OUR COMPANY
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          About VidIn
        </h1>

        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          Media moves fast. Understanding it should be effortless.
        </p>

        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Our mission</h2>
          <p className="leading-8 text-white/55">VidIn is being built to make audio and video easier to understand, search, and explore. We turn media into transcripts, AI-powered analysis, visual insights, and answers grounded in the source material.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">What we're building</h2>
          <p className="leading-8 text-white/55">Insight Vault brings transcription, media analysis, and conversational intelligence into one workspace. Our broader vision includes tools for creators and live media experiences.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Who develops VidIn</h2>
          <p className="leading-8 text-white/55">VidIn is developed by DonneyShel Corp. We're focused on building useful media intelligence technology that helps people move from information to understanding.</p>
        </section>
        </div>
      </div>
    </main>
  )
}
