'use client'

import { useState } from 'react'
import { Link2, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  YouTubeIcon,
  TikTokIcon,
  FacebookIcon,
  InstagramIcon,
} from '@/components/platform-icons'

const platforms = [
  { name: 'YouTube', Icon: YouTubeIcon },
  { name: 'TikTok', Icon: TikTokIcon },
  { name: 'Facebook', Icon: FacebookIcon },
  { name: 'Instagram', Icon: InstagramIcon },
]

export function UrlTranscribeBar() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || status === 'loading') return
    setStatus('loading')
    setTimeout(() => setStatus('done'), 1800)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="glass-card glow-border flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-background/60 px-3">
          <Link2 className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube, TikTok, Facebook or Instagram link…"
            className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Media URL"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-xl px-5" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Transcribe &amp; Analyze
            </>
          )}
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        {platforms.map(({ name, Icon }) => (
          <span
            key={name}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icon className="size-4" />
            {name}
          </span>
        ))}
      </div>

      {status === 'done' && (
        <div className="glass-card mt-6 rounded-xl p-4 text-left">
          <p className="font-mono text-xs uppercase tracking-widest text-chart-2">
            Transcript ready · 12:41 processed
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            &ldquo;…and that&apos;s the core thesis — real-time intelligence isn&apos;t about
            recording, it&apos;s about understanding the signal the instant it happens…&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
