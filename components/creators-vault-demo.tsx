'use client'

import { useState } from 'react'
import { AlertTriangle, Copy, Check, TrendingUp, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

// Retention curve sample points (percent viewers retained across the video)
const retention = [
  100, 96, 92, 89, 88, 86, 71, 58, 52, 55, 60, 63, 61, 44, 33, 30, 42, 58, 66, 64,
]

// Drop-off alerts — where content lags
const alerts = [
  { at: '02:10', label: 'Retention dip', note: 'Slow tangent — viewers dropped 15% in 20s.' },
  { at: '04:35', label: 'Dead content', note: 'Steep 24% fall. Consider cutting or tightening.' },
]

const hooks = [
  {
    platform: 'TikTok',
    duration: '0:09',
    text: 'Nobody tells you this about your first year — but it changes everything.',
    score: 94,
  },
  {
    platform: 'Reels',
    duration: '0:14',
    text: 'I tested it for 30 days so you don\u2019t have to. Here\u2019s what actually worked.',
    score: 91,
  },
  {
    platform: 'Shorts',
    duration: '0:11',
    text: 'The one mistake that quietly kills 90% of new creators.',
    score: 88,
  },
]

export function CreatorsVaultDemo() {
  const [copied, setCopied] = useState<number | null>(null)

  function copy(i: number, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  const max = Math.max(...retention)

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Dead content detection */}
      <div className="glass-card rounded-2xl p-5 lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Dead content detection
            </p>
            <p className="mt-1 text-sm font-medium">Retention timeline · &ldquo;My Studio Setup&rdquo;</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 font-mono text-xs text-chart-4">
            <AlertTriangle className="size-3" />2 alerts
          </span>
        </div>

        {/* Bar chart */}
        <div className="mt-6">
          <div className="flex h-40 items-end gap-1">
            {retention.map((v, i) => {
              const isDrop = i > 0 && retention[i - 1] - v >= 10
              return (
                <div key={i} className="flex flex-1 flex-col justify-end">
                  <div
                    className={cn(
                      'w-full rounded-t-sm transition-colors',
                      isDrop ? 'bg-chart-4' : 'bg-chart-3/50',
                    )}
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
            <span>00:00</span>
            <span>Watch time</span>
            <span>06:20</span>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
          {alerts.map((a) => (
            <div
              key={a.at}
              className="flex items-start gap-3 rounded-xl border border-chart-4/30 bg-chart-4/5 p-3"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-chart-4" />
              <div>
                <p className="text-sm font-medium">
                  <span className="font-mono text-chart-4">{a.at}</span> · {a.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viral hook extractor */}
      <div className="glass-card flex flex-col rounded-2xl p-5 lg:col-span-2">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary">
            <Scissors className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Viral hook extractor</p>
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Auto-generated soundbites
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          {hooks.map((h, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  {h.platform} · {h.duration}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-chart-2">
                  <TrendingUp className="size-3" />
                  {h.score}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">&ldquo;{h.text}&rdquo;</p>
              <button
                type="button"
                onClick={() => copy(i, h.text)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied === i ? (
                  <>
                    <Check className="size-3.5 text-chart-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy hook
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
