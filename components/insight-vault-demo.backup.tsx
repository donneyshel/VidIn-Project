'use client'

import { useState } from 'react'
import { Play, Pause, FileText, FileDown, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Segment = { t: number; time: string; speaker: string; text: string }

const segments: Segment[] = [
  {
    t: 0,
    time: '00:00',
    speaker: 'Prof. Aldrin',
    text: 'Today we are covering the fundamentals of thermodynamics — specifically, why entropy always increases in an isolated system.',
  },
  {
    t: 42,
    time: '00:42',
    speaker: 'Prof. Aldrin',
    text: 'The second law is often misunderstood. It does not say disorder must increase everywhere — only that total entropy of a closed system never decreases.',
  },
  {
    t: 96,
    time: '01:36',
    speaker: 'Student',
    text: 'So does that mean a refrigerator violates the law, since it makes things colder and more ordered?',
  },
  {
    t: 128,
    time: '02:08',
    speaker: 'Prof. Aldrin',
    text: 'Great question. No — the fridge exports more entropy to the room than it removes from the food. The system as a whole still trends upward.',
  },
  {
    t: 184,
    time: '03:04',
    speaker: 'Prof. Aldrin',
    text: 'Keep that framing in mind for the problem set: always define your system boundary before you reason about entropy.',
  },
]

const chat = [
  {
    q: 'Summarize this lecture in one sentence.',
    a: 'Entropy in a closed system never decreases — you must define your system boundary before reasoning about order or disorder.',
  },
  {
    q: 'Why does a fridge not break the second law?',
    a: 'Because it exports more entropy to the surrounding room than it removes from the food, so total system entropy still rises. (See 02:08.)',
  },
  {
    q: 'What should I remember for the problem set?',
    a: 'Always define your system boundary first — the professor stresses this at 03:04 as the key to every entropy question.',
  },
]

export function InsightVaultDemo() {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [selectedQ, setSelectedQ] = useState(0)

  const total = segments[segments.length - 1].t + 60
  const progress = Math.min(100, (segments[active].t / total) * 100 + 8)

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Transcript */}
      <div className="glass-card rounded-2xl p-5 lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Interactive transcript
            </p>
            <p className="mt-1 text-sm font-medium">Thermodynamics · Lecture 04</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-mono text-xs text-chart-2">
            <span className="size-1.5 rounded-full bg-chart-2" />
            Synced
          </span>
        </div>

        <ul className="mt-4 flex max-h-[340px] flex-col gap-1 overflow-y-auto pr-1">
          {segments.map((seg, i) => (
            <li key={seg.t}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  'flex w-full gap-3 rounded-xl p-3 text-left transition-colors',
                  i === active ? 'bg-secondary' : 'hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0 font-mono text-xs',
                    i === active ? 'text-chart-2' : 'text-muted-foreground',
                  )}
                >
                  {seg.time}
                </span>
                <span>
                  <span className="block text-xs font-medium text-muted-foreground">
                    {seg.speaker}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-sm leading-relaxed',
                      i === active ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {seg.text}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Player */}
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              className="size-9 rounded-full"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{segments[active].time}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <FileText className="size-3.5" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="size-3.5" />
              Export Markdown
            </Button>
          </div>
        </div>
      </div>

      {/* AI chat */}
      <div className="glass-card flex flex-col rounded-2xl p-5 lg:col-span-2">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Ask this lecture</p>
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              AI chat
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-3 py-2 text-sm">
            {chat[selectedQ].q}
          </div>
          <div className="mr-auto max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-background/60 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
            {chat[selectedQ].a}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
            Try a question
          </p>
          {chat.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedQ(i)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                i === selectedQ
                  ? 'border-white/20 bg-secondary text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {c.q}
            </button>
          ))}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3">
            <input
              disabled
              placeholder="Ask questions about this lecture…"
              className="h-10 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              aria-label="Ask a question"
            />
            <Send className="size-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}
