import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "VidIn Documentation" + ' | VidIn',
  description: "A practical guide to getting started with VidIn.",
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
          VidIn Documentation
        </h1>
        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          A practical guide to getting started with VidIn.
        </p>
        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Get started</h2>
          <p className="leading-8 text-white/55">Create an account, sign in, and open Insight Vault from your workspace.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Work with media</h2>
          <p className="leading-8 text-white/55">Use the available upload or URL options to submit supported media. Processing depends on file format, source accessibility, and available usage credits.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Explore your transcript</h2>
          <p className="leading-8 text-white/55">After successful processing, review the transcript and its available timestamps.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">AI analysis</h2>
          <p className="leading-8 text-white/55">Use VidIn's analysis tools to explore key ideas and insights. Review evidence against the original media before relying on important conclusions.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Ask VidIn</h2>
          <p className="leading-8 text-white/55">Ask questions about processed media and review the supporting evidence where available.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Usage and billing</h2>
          <p className="leading-8 text-white/55">Check your workspace billing and usage pages for your available credits and current pricing.</p>
        </section>
        </div>
      </div>
    </main>
  )
}
