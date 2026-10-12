import { PREMIUM_SUBSCRIPTIONS_ENABLED } from '@/lib/billing/premium-launch'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { paystackRequest } from '@/lib/billing/paystack'
import { verifySubscriptionQuote } from '@/lib/billing/subscription-quote'
import { getSubscriptionName } from '@/lib/billing/subscription-pricing'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'

export const runtime = 'nodejs'

type CheckoutResponse = {
  authorization_url: string
  access_code: string
  reference: string
}

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
      !('quoteToken' in body) ||
      typeof body.quoteToken !== 'string'
    ) {
      return NextResponse.json(
        { error: 'A confirmed subscription quote is required.' },
        { status: 400 },
      )
    }

    let quote: ReturnType<typeof verifySubscriptionQuote>

    try {
      quote = verifySubscriptionQuote(body.quoteToken, user.id)
    } catch {
      return NextResponse.json(
        { error: 'Subscription quote is invalid or expired.' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()

    const { data: existing, error: lookupError } = await admin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('product', quote.product)
      .maybeSingle()

    if (lookupError) {
      throw new Error('Could not check subscription status.')
    }

    if (hasActiveSubscription(existing)) {
      return NextResponse.json(
        { error: 'This subscription is already active.' },
        { status: 409 },
      )
    }

    const reference = `vidin-sub-${randomUUID()}`

    const { error: insertError } = await admin
      .from('paystack_transactions')
      .insert({
        user_id: user.id,
        reference,
        transaction_type: 'subscription',
        subscription_product: quote.product,
        status: 'pending',
        amount_minor: quote.amountMinor,
        currency: 'GHS',
        purchased_seconds: null,
        base_currency: 'USD',
        base_amount_cents: quote.usdCents,
        exchange_rate_usd_ghs: quote.usdToGhsRate,
        exchange_rate_updated_at: quote.rateUpdatedAt,
      })

    if (insertError) {
      throw new Error('Could not create pending subscription payment.')
    }

    const checkout = await paystackRequest<CheckoutResponse>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: {
          email: user.email,
          amount: quote.amountMinor,
          currency: 'GHS',
          reference,
          metadata: {
            product: quote.product,
            billing_type: 'vidin_subscription_one_month',
            automatic_renewal: false,
            base_currency: 'USD',
            base_amount_cents: quote.usdCents,
            exchange_rate_usd_ghs: quote.usdToGhsRate,
            exchange_rate_updated_at: quote.rateUpdatedAt,
          },
        },
      },
    )

    if (
      !checkout.authorization_url ||
      !checkout.reference ||
      checkout.reference !== reference ||
      !/^https:\/\/[a-z0-9.-]*paystack\.com\//i.test(
        checkout.authorization_url,
      )
    ) {
      throw new Error('Invalid Paystack checkout response.')
    }

    return NextResponse.json({
      authorizationUrl: checkout.authorization_url,
      reference,
      product: quote.product,
      productName: getSubscriptionName(quote.product),
      billingInterval: 'monthly',
      automaticRenewal: false,
      amountMinor: quote.amountMinor,
      currency: 'GHS',
      baseCurrency: 'USD',
      baseAmountCents: quote.usdCents,
      exchangeRate: quote.usdToGhsRate,
      exchangeRateUpdatedAt: quote.rateUpdatedAt,
    })
  } catch (error) {
    console.error('Subscription checkout error:', error)

    return NextResponse.json(
      { error: 'Unable to initialize subscription payment.' },
      { status: 500 },
    )
  }
}
