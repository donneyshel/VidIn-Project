import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Security at VidIn" + ' | VidIn',
  description: "Practical information about account and media security.",
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0a12] px-5 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-16 inline-block text-sm text-[#c2b5ff] hover:text-white">
          ← Back to VidIn
        </Link>
        <p className="mb-5 font-mono text-xs tracking-[0.3em] text-[#c2b5ff]">
          VIDIN / RESOURCES
        </p>
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Security at VidIn
        </h1>
        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          Practical information about account and media security.
        </p>
        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Protect your account</h2>
          <p className="leading-8 text-white/55">Use a strong, unique password and keep your sign-in credentials private. Sign out of shared devices when finished.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Handle media responsibly</h2>
          <p className="leading-8 text-white/55">Only upload or process media you have permission to use. Avoid sharing confidential information unnecessarily.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Review AI-generated content</h2>
          <p className="leading-8 text-white/55">AI-generated transcripts and insights can contain mistakes. Verify important information against the original source.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Security information</h2>
          <p className="leading-8 text-white/55">This page provides general guidance, not a certification, independent audit, or guarantee of specific security controls.</p>
        </section>
        </div>
      </div>
    </main>
  )
}
