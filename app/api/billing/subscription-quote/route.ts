import { PREMIUM_SUBSCRIPTIONS_ENABLED } from '@/lib/billing/premium-launch'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createSubscriptionQuote,
} from '@/lib/billing/subscription-quote'
import {
  getSubscriptionName,
  isSubscriptionProduct,
} from '@/lib/billing/subscription-pricing'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!PREMIUM_SUBSCRIPTIONS_ENABLED) {
    return NextResponse.json(
      {
        error: 'Premium subscriptions are not available yet. Insight Vault PAYG remains available.',
      },
      { status: 403 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Sign in to purchase a subscription.' },
        { status: 401 },
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request.' },
        { status: 400 },
      )
    }

    if (
      !body ||
      typeof body !== 'object' ||
      !('product' in body) ||
      !isSubscriptionProduct(body.product)
    ) {
      return NextResponse.json(
        { error: 'Choose a valid subscription product.' },
        { status: 400 },
      )
    }

    const product = body.product

    const { data: existing, error: lookupError } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('product', product)
      .maybeSingle()

    if (lookupError) {
      throw new Error('Could not check subscription status.')
    }

    if (
      existing?.status === 'active' &&
      existing.current_period_end &&
      Date.parse(existing.current_period_end) > Date.now()
    ) {
      return NextResponse.json(
        { error: 'This subscription is already active.' },
        { status: 409 },
      )
    }

    const { quote, token } = await createSubscriptionQuote(
      user.id,
      product,
    )

    return NextResponse.json({
      quoteToken: token,
      product: quote.product,
      productName: getSubscriptionName(quote.product),
      billingInterval: 'monthly',
      baseCurrency: 'USD',
      baseAmountCents: quote.usdCents,
      currency: quote.currency,
      amountMinor: quote.amountMinor,
      exchangeRate: quote.usdToGhsRate,
      exchangeRateUpdatedAt: quote.rateUpdatedAt,
      expiresAt: new Date(quote.expiresAt).toISOString(),
      automaticRenewal: false,
      renewalDisclosure:
        'This quote covers one month of access. Automatic renewal is not enabled for this checkout.',
    })
  } catch (error) {
    console.error('Subscription quote error:', error)

    return NextResponse.json(
      { error: 'Unable to prepare subscription payment.' },
      { status: 503 },
    )
  }
}
