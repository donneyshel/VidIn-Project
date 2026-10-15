import type { Metadata } from 'next'
import Link from 'next/link'
import { RenameRecording } from '@/components/rename-recording'
import {
  ArrowRight,
  Clock3,
  FileAudio,
  FileVideo,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Library — Workspace — Vidin',
  description:
    'Browse your saved recordings, transcripts, and media history in Vidin.',
}

type Recording = {
  id: string
  title: string
  source_type: string
  source_url: string | null
  thumbnail_url: string | null
  source_platform: string | null
  transcript: string | null
  segments: unknown[]
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(Number(seconds))) {
    return 'Duration unavailable'
  }

  const total = Math.max(0, Math.round(Number(seconds)))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getSourceLabel(sourceType: string) {
  switch (sourceType) {
    case 'url':
      return 'Media URL'
    case 'upload':
      return 'Upload'
    default:
      return sourceType
  }
}

function getRecordingIcon(sourceType: string) {
  return sourceType === 'url' ? FileVideo : FileAudio
}

type LibraryPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function LibraryPage({
  searchParams,
}: LibraryPageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('recordings')
    .select(
      'id, title, source_type, source_url, thumbnail_url, source_platform, transcript, segments, duration_seconds, created_at, updated_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Library
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your saved recordings and transcripts live here.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-semibold">We could not load your library</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            There was a problem loading your recordings. Please try refreshing
            the page.
          </p>
        </div>
      </div>
    )
  }

  const recordings = (data ?? []) as Recording[]
  const filteredRecordings = query
    ? recordings.filter((recording) =>
        [recording.title, recording.transcript ?? '']
          .some((value) => value.toLowerCase().includes(query.toLowerCase()))
      )
    : recordings

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Library
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your saved recordings, transcripts, and media history.
          </p>
        </div>

        <Link
          href="/workspace/insight-vault"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Sparkles className="size-4" />
          New transcription
        </Link>
      </div>

      <form action="/workspace/library" method="get" className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search recordings and transcripts..."
          aria-label="Search recordings and transcripts"
          className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
        {query && (
          <Link
            href="/workspace/library"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-5 text-sm"
          >
            Clear
          </Link>
        )}
      </form>

      {recordings.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center sm:p-14">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary">
            <FolderOpen className="size-6" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Your library is empty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Transcribe your first recording and it will automatically appear
            here with its transcript and timestamped segments.
          </p>

          <Link
            href="/workspace/insight-vault"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Create your first recording
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold">Your recordings</h2>

            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {recordings.length}
            </span>
          </div>

          {query && (
            <p className="mb-4 text-sm text-muted-foreground">
              {filteredRecordings.length} of {recordings.length} recordings match your search.
            </p>
          )}

          {query && filteredRecordings.length === 0 && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <h3 className="font-semibold">No matching recordings</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another title or keyword from a transcript.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {filteredRecordings.map((recording) => {
              const Icon = getRecordingIcon(recording.source_type)

              return (
                <article
                  key={recording.id}
                  className="glass-card rounded-2xl p-5 transition-colors hover:border-white/15"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:w-48">
                      {recording.thumbnail_url ? (
                        <img
                          src={recording.thumbnail_url}
                          alt={`Thumbnail for ${recording.title}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-background">
                          <Icon className="size-9 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        {recording.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span>{recording.source_platform || getSourceLabel(recording.source_type)}</span>

                        <span className="flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          {formatDuration(recording.duration_seconds)}
                        </span>

                        <span>{formatDate(recording.created_at)}</span>

                        {recording.transcript ? (
                          <span>Transcript ready</span>
                        ) : (
                          <span>Transcript unavailable</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <RenameRecording id={recording.id} title={recording.title} />
                      <Link
                        href={`/workspace/insight-vault?recording=${recording.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                      >
                        Open
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
