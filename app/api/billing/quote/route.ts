import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentQuote } from '@/lib/billing/payment-quote'
import { getUsdExchangeRates } from '@/lib/billing/exchange-rates'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } =
      await supabase.auth.getUser()

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Sign in to request a payment quote.' },
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
      !('minutes' in body) ||
      typeof body.minutes !== 'number' ||
      !Number.isInteger(body.minutes) ||
      body.minutes < 1 ||
      body.minutes > 1000
    ) {
      return NextResponse.json(
        { error: 'Minutes must be a whole number from 1 to 1000.' },
        { status: 400 },
      )
    }

    const { quote, token } = await createPaymentQuote(
      user.id,
      body.minutes,
    )

    const exchangeRates = await getUsdExchangeRates()

    if (exchangeRates.updatedAt !== quote.rateUpdatedAt) {
      throw new Error('Exchange-rate snapshot changed. Please retry.')
    }

    const displayRates: Record<string, number> = {}

    for (const currency of ['USD', 'GHS', 'EUR', 'GBP']) {
      const rate = exchangeRates.rates[currency]

      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        displayRates[currency] = rate
      }
    }

    if (
      displayRates.USD !== 1 ||
      displayRates.GHS !== quote.usdToGhsRate
    ) {
      throw new Error('Payment quote exchange rates are inconsistent.')
    }

    return NextResponse.json(
      {
        quoteToken: token,
        minutes: quote.minutes,
        usdCents: quote.usdCents,
        baseCurrency: 'USD',
        amountMinor: quote.amountMinor,
        currency: quote.currency,
        usdToGhsRate: quote.usdToGhsRate,
        rateUpdatedAt: quote.rateUpdatedAt,
        displayRates,
        expiresAt: new Date(quote.expiresAt).toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('Payment quote error:', error)

    return NextResponse.json(
      { error: 'Unable to calculate a payment quote. Please try again.' },
      { status: 503 },
    )
  }
}
