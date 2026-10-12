import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Coins,
  FileAudio,
  History,
  WalletCards,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Usage — Workspace — Vidin',
  description:
    'Track your Vidin processing balance, media activity, and usage history.',
}

type UsageBalance = {
  purchased_seconds: number
  free_seconds_remaining: number
  free_usage_date: string | null
}

type LedgerEntry = {
  id: string
  entry_type: 'purchase' | 'usage' | 'refund' | 'adjustment'
  seconds_delta: number
  recording_id: string | null
  payment_reference: string | null
  description: string | null
  created_at: string
}

type Recording = {
  id: string
  duration_seconds: number | null
  created_at: string
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))

  if (safeSeconds < 60) {
    return `${safeSeconds}s`
  }

  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) {
    if (minutes === 0) {
      return `${hours}h`
    }

    return `${hours}h ${minutes}m`
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function ledgerLabel(entry: LedgerEntry) {
  switch (entry.entry_type) {
    case 'purchase':
      return 'Minutes purchased'
    case 'usage':
      return 'Processing usage'
    case 'refund':
      return 'Usage refund'
    case 'adjustment':
      return 'Balance adjustment'
  }
}

export default async function UsagePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const [
    { data: usageRows, error: usageError },
    { data: ledgerRows, error: ledgerError },
    { data: recordingRows, error: recordingsError },
  ] = await Promise.all([
    supabase.rpc('get_usage_balance'),

    supabase
      .from('minute_ledger')
      .select(
        'id, entry_type, seconds_delta, recording_id, payment_reference, description, created_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('recordings')
      .select('id, duration_seconds, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (usageError || ledgerError || recordingsError) {
    console.error('Usage page error:', {
      usageError,
      ledgerError,
      recordingsError,
    })

    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Account
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Usage
          </h1>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-semibold">We could not load your usage</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            There was a problem loading your processing activity. Refresh the
            page and try again.
          </p>
        </div>
      </div>
    )
  }

  const usage = (usageRows?.[0] ?? {
    purchased_seconds: 0,
    free_seconds_remaining: 60,
    free_usage_date: null,
  }) as UsageBalance

  const ledger = (ledgerRows ?? []) as LedgerEntry[]
  const recordings = (recordingRows ?? []) as Recording[]

  const freeSeconds = Number(usage.free_seconds_remaining) || 0
  const purchasedSeconds = Number(usage.purchased_seconds) || 0
  const totalAvailable = freeSeconds + purchasedSeconds

  const totalProcessedSeconds = recordings.reduce(
    (total, recording) =>
      total + Math.max(0, Number(recording.duration_seconds) || 0),
    0,
  )

  const freeSecondsUsedToday = Math.max(0, 60 - freeSeconds)
  const freePercentage = Math.min(
    100,
    Math.max(0, (freeSecondsUsedToday / 60) * 100),
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Account
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Usage
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          See how much processing time you have available and understand how
          your Vidin usage changes over time.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Clock3 className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">Free today</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(freeSeconds)}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Resets to 1 minute every UTC day.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Coins className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">Purchased balance</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(purchasedSeconds)}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Purchased processing time never expires.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <WalletCards className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">Available processing</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(totalAvailable)}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Daily free time plus purchased balance.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <FileAudio className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">Media processed</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {recordings.length}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {formatTime(totalProcessedSeconds)} across saved media.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Daily free minute</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Every account receives 60 seconds of free processing each UTC
                day.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {formatTime(freeSeconds)} left
            </span>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(freeSecondsUsedToday)} used</span>
              <span>60s daily</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[var(--vidin-signal)] transition-all"
                style={{ width: `${freePercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h2 className="font-semibold">Need more processing time?</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Vidin processing is pay as you go at $0.09 per minute. Purchased
            minutes are added to your balance and do not expire.
          </p>

          <Link
            href="/workspace/billing"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Manage billing
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Usage activity</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Purchases and purchased-minute balance changes appear here.
            </p>
          </div>

          <History className="size-5 text-muted-foreground" />
        </div>

        <div className="glass-card overflow-hidden rounded-2xl">
          {ledger.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-secondary">
                <History className="size-5" />
              </div>

              <h3 className="mt-4 font-medium">No usage activity yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Purchased-minute transactions and processing deductions will
                appear here once usage billing is active.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ledger.map((entry) => {
                const positive = Number(entry.seconds_delta) > 0

                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      {positive ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownRight className="size-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {ledgerLabel(entry)}
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {entry.description || formatDate(entry.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {positive ? '+' : '-'}
                        {formatTime(Math.abs(Number(entry.seconds_delta)))}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
