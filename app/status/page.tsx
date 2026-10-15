import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "VidIn Service Status" + ' | VidIn',
  description: "Information about VidIn service availability.",
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
          VidIn Service Status
        </h1>
        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          Information about VidIn service availability.
        </p>
        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Live service</h2>
          <p className="leading-8 text-white/55">Visit vidin.pro to access the application. This page does not currently perform automated health checks or display live uptime metrics.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Processing availability</h2>
          <p className="leading-8 text-white/55">Media processing may depend on external providers, media accessibility, and available service capacity.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Service updates</h2>
          <p className="leading-8 text-white/55">A dedicated monitoring and incident reporting system may be added in the future. No real-time status is claimed on this page.</p>
        </section>
        </div>
      </div>
    </main>
  )
}
