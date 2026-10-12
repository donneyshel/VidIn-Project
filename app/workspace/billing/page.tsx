import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Clock3,
  Coins,
  CreditCard,
  Radio,
  Sparkles,
  Video,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreditCalculator } from '@/components/credit-calculator'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'

export const metadata: Metadata = {
  title: 'Billing — Workspace — Vidin',
  description:
    'Manage Vidin processing usage, purchased minutes, and premium subscriptions.',
}

type UsageBalance = {
  purchased_seconds: number
  free_seconds_remaining: number
  free_usage_date: string | null
}

type Subscription = {
  product: 'creators' | 'live'
  status: 'inactive' | 'active' | 'past_due' | 'cancelled'
  current_period_end: string | null
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))

  if (safeSeconds < 60) {
    return `${safeSeconds}s`
  }

  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} min`
  }

  return `${minutes}m ${remainingSeconds}s`
}

function subscriptionPeriodMessage(
  subscription: Subscription | undefined,
) {
  if (!subscription?.current_period_end) {
    return 'One month of access per payment. Automatic renewal is disabled.'
  }

  const expiry = new Date(subscription.current_period_end)

  if (!Number.isFinite(expiry.getTime())) {
    return 'One month of access per payment. Automatic renewal is disabled.'
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(expiry)

  if (hasActiveSubscription(subscription)) {
    return `Access ends ${formattedDate} UTC. No automatic renewal or additional charge.`
  }

  return `Previous access ended ${formattedDate} UTC. Purchase another month to renew.`
}

function subscriptionLabel(
  subscription: Subscription | undefined,
) {
  if (!subscription) {
    return 'Not subscribed'
  }

  if (subscription.status === 'active') {
    return hasActiveSubscription(subscription)
      ? 'Active'
      : 'Expired'
  }

  switch (subscription.status) {
    case 'past_due':
      return 'Past due'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Not subscribed'
  }
}

export default async function BillingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: usageRows, error: usageError } = await supabase.rpc(
    'get_usage_balance',
  )

  const { data: subscriptionRows, error: subscriptionsError } =
    await supabase
      .from('subscriptions')
      .select('product, status, current_period_end')
      .eq('user_id', user.id)

  if (usageError || subscriptionsError) {
    console.error('Billing page error:', {
      usageError,
      subscriptionsError,
    })

    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Account
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Billing
          </h1>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <h2 className="font-semibold">We could not load your billing</h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            There was a problem loading your usage or subscription information.
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    )
  }

  const usage = (usageRows?.[0] ?? {
    purchased_seconds: 0,
    free_seconds_remaining: 10,
    free_usage_date: null,
  }) as UsageBalance

  const subscriptions = (subscriptionRows ?? []) as Subscription[]

  const creators = subscriptions.find(
    (subscription) => subscription.product === 'creators',
  )

  const live = subscriptions.find(
    (subscription) => subscription.product === 'live',
  )

  const purchasedSeconds = Number(usage.purchased_seconds) || 0
  const freeSeconds = Number(usage.free_seconds_remaining) || 0
  const totalSeconds = purchasedSeconds + freeSeconds

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <div className="mb-10">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Account
        </p>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Billing
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage your processing time and premium Vidin access.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Clock3 className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">
            Free today
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(freeSeconds)}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            You receive 10 free processing seconds every UTC day.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <Coins className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">
            Purchased balance
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(purchasedSeconds)}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Purchased processing time does not expire.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-6 flex size-10 items-center justify-center rounded-xl bg-secondary">
            <CreditCard className="size-5" />
          </div>

          <p className="text-sm text-muted-foreground">
            Available processing
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatTime(totalSeconds)}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Free daily time plus your purchased PAYG balance.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="font-semibold">Pay as you go</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Processing is billed separately from premium subscriptions.
          </p>
        </div>

        <CreditCalculator />
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="font-semibold">Premium access</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Subscriptions unlock premium products. Processing time remains PAYG.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Video className="size-5" />
              </div>

              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {subscriptionLabel(creators)}
              </span>
            </div>

            <h3 className="mt-6 text-lg font-semibold">
              Creators Vault
            </h3>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold">$29.99</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Premium creator tools and workflows built for turning media
              intelligence into reusable content.
            </p>

            <Link
              href="/creators-vault"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
            >
              <Sparkles className="size-4" />
              View Creators Vault
            </Link>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {subscriptionPeriodMessage(creators)}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Radio className="size-5" />
              </div>

              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {subscriptionLabel(live)}
              </span>
            </div>

            <h3 className="mt-6 text-lg font-semibold">
              Live Ecosystem
            </h3>

            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold">$49.99</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Premium live intelligence for real-time media experiences and
              interactive workflows.
            </p>

            <Link
              href="/live-ecosystem"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
            >
              <Radio className="size-4" />
              View Live Ecosystem
            </Link>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {subscriptionPeriodMessage(live)}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
