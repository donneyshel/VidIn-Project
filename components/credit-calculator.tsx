'use client'

import { useState } from 'react'
import { Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const RATE = 0.05 // $ per minute
const presets = [60, 120, 300, 600]

export function CreditCalculator() {
  const [minutes, setMinutes] = useState(120)
  const cost = (minutes * RATE).toFixed(2)
  const hours = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)

  return (
    <div className="glass-card glow-border rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Controls */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Minutes to transcribe
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{minutes}</span>
            <span className="text-sm text-muted-foreground">minutes · ~{hours}h</span>
          </div>

          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="Minutes to transcribe"
            className="mt-5 w-full accent-primary"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMinutes(p)}
                className={
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (minutes === p
                    ? 'border-white/25 bg-secondary text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground')
                }
              >
                {p} min
              </button>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="rounded-2xl border border-border bg-background/60 p-6 text-center lg:w-64">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Estimated total
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums">${cost}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {minutes} min × $0.05 / min
          </p>
          <Button className="mt-6 w-full rounded-xl">
            <Sparkles className="size-4" />
            Buy Credits
          </Button>
          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            Credits never expire. No subscription.
          </p>
        </div>
      </div>
    </div>
  )
}
