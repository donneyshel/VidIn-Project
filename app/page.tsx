import Link from 'next/link'
import { ArrowDown, ArrowRight, AudioLines, BrainCircuit, Radio } from 'lucide-react'
import { SectionLabel } from '@/components/section-label'
import { VidinIntelligenceWorld } from '@/components/vidin-world/vidin-intelligence-world'

const vaults = [
  {
    number: '01',
    eyebrow: 'UNDERSTAND',
    name: 'Insight Vault',
    title: 'Know exactly what was said.',
    description:
      'Turn lectures, interviews, podcasts, meetings and recordings into searchable intelligence. Follow the conversation by timestamp, ask questions, and uncover what matters.',
    href: '/insight-vault',
    Icon: BrainCircuit,
  },
  {
    number: '02',
    eyebrow: 'OPTIMIZE',
    name: 'Creators Vault',
    title: 'Know what deserves attention.',
    description:
      'Understand the moments inside your content that hold attention, where audiences disappear, and which ideas can become your next short-form opportunity.',
    href: '/creators-vault',
    Icon: AudioLines,
  },
  {
    number: '03',
    eyebrow: 'RESPOND',
    name: 'Live Ecosystem',
    title: 'Know what is happening now.',
    description:
      'Transform live streams and financial media into structured signals so emerging information can be understood while it is happening.',
    href: '/live-ecosystem',
    Icon: Radio,
  },
]

export default function HomePage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* HERO — THE LIVING VIDIN WORLD */}
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
        {/* The living world is the environment, not a card. */}
        <div className="absolute inset-0">
          <VidinIntelligenceWorld />
        </div>

        {/* Cinematic veil keeps the foreground readable. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_12%,rgba(8,9,12,0.08)_38%,rgba(8,9,12,0.78)_100%)]" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background via-background/70 to-transparent" />

        {/* Foreground story */}
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1500px] flex-col justify-between px-5 pb-10 pt-8 sm:px-8 sm:pb-12 lg:px-12">
          <div className="flex items-start justify-between">
            <SectionLabel>Real-time media intelligence</SectionLabel>

            <span className="hidden font-mono text-[9px] uppercase tracking-[0.28em] text-white/35 sm:block">
              Signal / Processing / Intelligence
            </span>
          </div>

          <div className="max-w-6xl pb-4">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
              Enter the intelligence world
            </p>

            <h1 className="max-w-6xl text-balance text-[clamp(4rem,10vw,10rem)] font-medium leading-[0.82] tracking-[-0.075em]">
              Everything you hear
              <br />
              <span className="text-muted-foreground">leaves a trace.</span>
            </h1>

            <div className="mt-9 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-xl text-base leading-7 text-white/55 sm:text-lg">
                Vidin turns moving media into structured intelligence — so you can understand
                what was said, what matters, and what happens next.
              </p>

              <Link
                href="/auth"
                className="group inline-flex h-12 shrink-0 items-center gap-3 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
              >
                Enter Vidin
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/35">
            <ArrowDown className="size-4 animate-bounce" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em]">
              Scroll to enter the system
            </span>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="border-y border-border px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <SectionLabel>The Vidin system</SectionLabel>
            </div>

            <div>
              <p className="max-w-5xl text-balance text-3xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                The world produces more media every second. Vidin turns that stream into
                something you can actually work with.
              </p>

              <p className="mt-10 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                A lecture. A podcast. A campaign. A market broadcast. A live conversation.
                Different media, one underlying problem: information moves faster than humans
                can process it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section id="ecosystem" className="px-5 py-28 sm:px-8 sm:py-40 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="max-w-3xl">
            <SectionLabel>One engine. Three directions.</SectionLabel>

            <h2 className="mt-7 text-balance text-4xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Intelligence built around what you need to do next.
            </h2>
          </div>

          <div className="mt-20 border-t border-border">
            {vaults.map(({ number, eyebrow, name, title, description, href, Icon }) => (
              <Link
                key={name}
                href={href}
                className="group grid gap-8 border-b border-border py-12 transition-opacity hover:opacity-70 lg:grid-cols-[0.18fr_0.25fr_1fr_auto] lg:items-start"
              >
                <span className="font-mono text-xs text-muted-foreground">{number}</span>

                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      {eyebrow}
                    </p>
                    <p className="mt-1 text-sm font-medium">{name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">{title}</h3>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </div>

                <ArrowRight className="hidden size-5 transition-transform group-hover:translate-x-1 lg:block" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MEDIA → INTELLIGENCE */}
      <section className="px-5 pb-28 sm:px-8 sm:pb-40 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] border border-border bg-[#08090c] px-6 py-16 sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.08),transparent_38%)]" />

            <div className="relative z-10 flex min-h-[500px] flex-col justify-between">
              <div>
                <SectionLabel>From signal to meaning</SectionLabel>
              </div>

              <div className="max-w-5xl">
                <p className="text-balance text-4xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-6xl lg:text-8xl">
                  Listen.
                  <br />
                  Understand.
                  <br />
                  <span className="text-muted-foreground">Act.</span>
                </p>
              </div>

              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                <p className="max-w-md text-sm leading-6 text-white/45">
                  Vidin is designed to disappear behind the experience. The complexity stays in
                  the engine. The intelligence stays with you.
                </p>

                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white"
                >
                  Start with Vidin
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 pb-32 sm:px-8 sm:pb-44 lg:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="border-t border-border pt-16">
            <SectionLabel>Vidin</SectionLabel>

            <h2 className="mt-8 max-w-5xl text-balance text-5xl font-medium leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-9xl">
              The media
              <br />
              is already
              <br />
              moving.
            </h2>

            <div className="mt-12 flex flex-wrap items-center gap-4">
              <Link
                href="/auth"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-medium text-background"
              >
                Enter Vidin
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-medium"
              >
                View plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
