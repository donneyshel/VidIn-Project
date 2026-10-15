import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get in touch | VidIn',
  description: "Questions, ideas, or feedback? We'd like to hear from you.",
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0b0a12] px-5 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-16 inline-block text-sm text-[#c2b5ff] hover:text-white">
          ← Back to VidIn
        </Link>

        <p className="mb-5 font-mono text-xs tracking-[0.3em] text-[#c2b5ff]">
          CONTACT
        </p>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          Get in touch
        </h1>

        <p className="mb-14 mt-7 max-w-2xl text-lg leading-8 text-white/55">
          Questions, ideas, or feedback? We'd like to hear from you.
        </p>

        <div className="grid gap-5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Product support</h2>
          <p className="leading-8 text-white/55">For questions about VidIn, account access, or product functionality, please use the support channel provided through your VidIn account when available.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Partnerships</h2>
          <p className="leading-8 text-white/55">We're interested in conversations about how media intelligence can support creators, organizations, and new digital experiences.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
          <h2 className="mb-4 text-xl font-semibold text-white">Contact information</h2>
          <p className="leading-8 text-white/55">
            For support, partnerships, business enquiries, or feedback, email VidIn directly.
          </p>
          <a
            href="mailto:donneyshel@gmail.com"
            className="mt-4 inline-block text-lg font-medium text-[#c2b5ff] underline underline-offset-4 hover:text-white"
          >
            donneyshel@gmail.com
          </a>
        </section>
        </div>
      </div>
    </main>
  )
}
