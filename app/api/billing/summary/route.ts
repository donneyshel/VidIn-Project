import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'

type UsageBalance = {
  purchased_seconds: number
  free_seconds_remaining: number
  free_usage_date: string | null
}

type Subscription = {
  product: 'creators' | 'live'
  status: 'inactive' | 'active' | 'past_due' | 'cancelled'
  current_period_start: string | null
  current_period_end: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'You must be signed in to view billing.' },
        { status: 401 },
      )
    }

    const { data: usageRows, error: usageError } = await supabase.rpc(
      'get_usage_balance',
    )

    if (usageError) {
      console.error('Billing usage balance error:', usageError)

      return NextResponse.json(
        {
          error: 'Could not load your usage balance.',
          details: usageError.message,
        },
        { status: 500 },
      )
    }

    const usage = (usageRows?.[0] ?? null) as UsageBalance | null

    if (!usage) {
      return NextResponse.json(
        { error: 'Could not initialize your billing account.' },
        { status: 500 },
      )
    }

    const { data: subscriptionRows, error: subscriptionsError } =
      await supabase
        .from('subscriptions')
        .select(
          'product, status, current_period_start, current_period_end',
        )
        .eq('user_id', user.id)

    if (subscriptionsError) {
      console.error('Billing subscriptions error:', subscriptionsError)

      return NextResponse.json(
        {
          error: 'Could not load your subscriptions.',
          details: subscriptionsError.message,
        },
        { status: 500 },
      )
    }

    const subscriptions = (subscriptionRows ?? []) as Subscription[]

    const creators =
      subscriptions.find((subscription) => subscription.product === 'creators') ??
      null

    const live =
      subscriptions.find((subscription) => subscription.product === 'live') ??
      null

    return NextResponse.json({
      usage: {
        freeSecondsRemaining: usage.free_seconds_remaining,
        purchasedSeconds: usage.purchased_seconds,
        totalSecondsAvailable:
          usage.free_seconds_remaining + usage.purchased_seconds,
        freeUsageDate: usage.free_usage_date,
      },
      access: {
        creators: {
          active: hasActiveSubscription(creators),
          status: creators?.status ?? 'inactive',
          currentPeriodStart: creators?.current_period_start ?? null,
          currentPeriodEnd: creators?.current_period_end ?? null,
        },
        live: {
          active: hasActiveSubscription(live),
          status: live?.status ?? 'inactive',
          currentPeriodStart: live?.current_period_start ?? null,
          currentPeriodEnd: live?.current_period_end ?? null,
        },
      },
    })
  } catch (error) {
    console.error('Billing summary error:', error)

    return NextResponse.json(
      { error: 'Something went wrong while loading billing.' },
      { status: 500 },
    )
  }
}
