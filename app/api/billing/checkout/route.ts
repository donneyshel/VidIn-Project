import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { paystackRequest } from '@/lib/billing/paystack'
import { verifyPaymentQuote } from '@/lib/billing/payment-quote'

export const runtime = 'nodejs'

type CheckoutResponse = {
  authorization_url: string
  access_code: string
  reference: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Sign in with an email to purchase minutes.' },
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
        { error: 'A confirmed payment quote is required.' },
        { status: 400 },
      )
    }

    let quote: ReturnType<typeof verifyPaymentQuote>

    try {
      quote = verifyPaymentQuote(body.quoteToken, user.id)
    } catch {
      return NextResponse.json(
        { error: 'Payment quote is invalid or expired. Request a new quote.' },
        { status: 400 },
      )
    }

    const minutes = quote.minutes
    const usdCents = quote.usdCents
    const amount = quote.amountMinor
    const usdToGhsRate = quote.usdToGhsRate

    const purchasedSeconds = minutes * 60

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new Error('Invalid checkout amount.')
    }

    const reference = `vidin-payg-${randomUUID()}`
    const admin = createAdminClient()

    const { error: insertError } = await admin
      .from('paystack_transactions')
      .insert({
        user_id: user.id,
        reference,
        transaction_type: 'minute_purchase',
        status: 'pending',
        amount_minor: amount,
        currency: 'GHS',
        purchased_seconds: purchasedSeconds,
        base_currency: 'USD',
        base_amount_cents: usdCents,
        exchange_rate_usd_ghs: usdToGhsRate,
        exchange_rate_updated_at: quote.rateUpdatedAt,
      })

    if (insertError) {
      throw new Error('Could not create pending payment.')
    }

    const checkout = await paystackRequest<CheckoutResponse>(
      '/transaction/initialize',
      {
        method: 'POST',
        body: {
          email: user.email,
          amount,
          currency: 'GHS',
          reference,
          metadata: {
            product: 'vidin_payg',
            minutes,
            base_currency: 'USD',
            base_amount_cents: usdCents,
            exchange_rate_usd_ghs: usdToGhsRate,
            exchange_rate_updated_at: quote.rateUpdatedAt,
          },
        },
      },
    )

    if (!checkout.authorization_url ||
        !checkout.reference ||
        checkout.reference !== reference) {
      throw new Error('Invalid Paystack checkout response.')
    }

    return NextResponse.json({
      authorizationUrl: checkout.authorization_url,
      reference,
      minutes,
      amountMinor: amount,
      currency: 'GHS',
      baseCurrency: 'USD',
      baseAmountCents: usdCents,
      exchangeRate: usdToGhsRate,
      exchangeRateUpdatedAt: quote.rateUpdatedAt,
    })
  } catch (error) {
    console.error('PAYG checkout error:', error)

    return NextResponse.json(
      { error: 'Unable to initialize payment.' },
      { status: 500 },
    )
  }
}
