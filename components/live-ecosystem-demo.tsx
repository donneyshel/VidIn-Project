'use client'

import { useEffect, useRef, useState } from 'react'
import { Radio, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

type Line = { time: string; text: string; tag?: 'rate' | 'macro' | 'flag' }

const feed: Line[] = [
  { time: '14:02:01', text: 'Fed Chair opens remarks on the current inflation trajectory.' },
  { time: '14:02:14', text: 'Labor market remains resilient but showing gradual cooling.', tag: 'macro' },
  { time: '14:02:38', text: 'Committee holds benchmark rate steady at 4.25%\u20134.50%.', tag: 'rate' },
  { time: '14:03:05', text: '"We are prepared to adjust the stance of policy as appropriate."' },
  { time: '14:03:29', text: 'Dot plot signals two potential cuts before year-end.', tag: 'flag' },
  { time: '14:03:52', text: 'Balance sheet runoff to continue at the current pace.', tag: 'macro' },
  { time: '14:04:18', text: 'Q&A begins — first question on commercial real estate risk.' },
]

const predictions = [
  {
    signal: 'Rate held + dovish dot plot',
    match: '2019 Jul',
    outcome: 'S&P +2.1% over 5 sessions',
    dir: 'up' as const,
    conf: 78,
  },
  {
    signal: 'Two cuts signalled year-end',
    match: '2024 Sep',
    outcome: 'USD index -1.4%, gold +3.2%',
    dir: 'up' as const,
    conf: 71,
  },
  {
    signal: 'CRE risk flagged in Q&A',
    match: '2023 Mar',
    outcome: 'Regional banks -6.8%',
    dir: 'down' as const,
    conf: 64,
  },
]

export function LiveEcosystemDemo() {
  const [count, setCount] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => (c >= feed.length ? 1 : c + 1))
      setElapsed((e) => e + 1)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [count])

  const visible = feed.slice(0, count)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const tagColor: Record<string, string> = {
    rate: 'text-chart-5',
    macro: 'text-chart-2',
    flag: 'text-chart-4',
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Live terminal */}
      <div className="glass-card overflow-hidden rounded-2xl lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border bg-background/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-4 opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-chart-4" />
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Live · Fed Presser Stream
            </span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            REC {mm}:{ss}
          </span>
        </div>

        <div ref={scrollRef} className="h-[340px] overflow-y-auto px-5 py-4 font-mono text-sm">
          {visible.map((line, i) => (
            <div key={i} className="mb-3 flex gap-3">
              <span className="shrink-0 text-muted-foreground">{line.time}</span>
              <span className={cn('leading-relaxed', line.tag ? tagColor[line.tag] : 'text-foreground')}>
                {line.text}
                {line.tag && (
                  <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[0.65rem] uppercase tracking-widest">
                    {line.tag}
                  </span>
                )}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="size-3.5 animate-pulse" />
            <span className="text-xs">transcribing…</span>
          </div>
        </div>
      </div>

      {/* Macro prediction engine */}
      <div className="glass-card flex flex-col rounded-2xl p-5 lg:col-span-2">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary">
            <Activity className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Macro prediction engine</p>
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Historical pattern match
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          {predictions.map((p, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{p.signal}</p>
                <span
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium',
                    p.dir === 'up' ? 'text-chart-2' : 'text-chart-4',
                  )}
                >
                  {p.dir === 'up' ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {p.conf}%
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Matches{' '}
                <span className="font-mono text-foreground">{p.match}</span> →{' '}
                <span className={p.dir === 'up' ? 'text-chart-2' : 'text-chart-4'}>{p.outcome}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-border pt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
          Historical outcomes are illustrative and not investment advice.
        </p>
      </div>
    </div>
  )
}
