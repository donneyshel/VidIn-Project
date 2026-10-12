'use client'

import { useState } from 'react'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SubscriptionProduct } from '@/lib/billing/subscription-pricing'

type SubscriptionQuoteResponse = {
  quoteToken: string
  product: SubscriptionProduct
  productName: string
  billingInterval: string
  baseCurrency: string
  baseAmountCents: number
  currency: string
  amountMinor: number
  exchangeRate: number
  exchangeRateUpdatedAt: string
  expiresAt: string
  automaticRenewal: boolean
  renewalDisclosure: string
}

type CheckoutResponse = {
  authorizationUrl?: string
  product?: SubscriptionProduct
  amountMinor?: number
  currency?: string
  error?: string
}

const prices: Record<SubscriptionProduct, number> = {
  creators: 2999,
  live: 4999,
}

function formatMoney(minorUnits: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(minorUnits / 100)
}

export function SubscriptionCheckout({
  product,
  active,
}: {
  product: SubscriptionProduct
  active: boolean
}) {
  const [quote, setQuote] = useState<SubscriptionQuoteResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function reviewPayment() {
    if (loading || active) return

    setLoading(true)
    setError('')
    setQuote(null)

    try {
      const response = await fetch('/api/billing/subscription-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to prepare payment.')
      }

      const nextQuote = result as SubscriptionQuoteResponse

      if (
        nextQuote.product !== product ||
        nextQuote.baseCurrency !== 'USD' ||
        nextQuote.baseAmountCents !== prices[product] ||
        nextQuote.currency !== 'GHS' ||
        !Number.isSafeInteger(nextQuote.amountMinor) ||
        nextQuote.amountMinor <= 0 ||
        typeof nextQuote.quoteToken !== 'string' ||
        !Number.isFinite(Date.parse(nextQuote.expiresAt)) ||
        nextQuote.automaticRenewal !== false
      ) {
        throw new Error('Invalid subscription quote received.')
      }

      setQuote(nextQuote)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to prepare payment.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function confirmPayment() {
    if (!quote || loading || active) return

    if (Date.parse(quote.expiresAt) <= Date.now()) {
      setQuote(null)
      setError('Quote expired. Please review payment again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/billing/subscription-checkout',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteToken: quote.quoteToken }),
        },
      )

      const result = (await response.json()) as CheckoutResponse

      if (!response.ok) {
        throw new Error(result.error || 'Unable to start checkout.')
      }

      if (
        result.product !== product ||
        result.amountMinor !== quote.amountMinor ||
        result.currency !== 'GHS' ||
        !result.authorizationUrl
      ) {
        throw new Error('Checkout does not match the confirmed quote.')
      }

      const url = new URL(result.authorizationUrl)

      if (
        url.protocol !== 'https:' ||
        !(
          url.hostname === 'paystack.com' ||
          url.hostname.endsWith('.paystack.com')
        )
      ) {
        throw new Error('Unexpected payment destination.')
      }

      window.location.assign(url.toString())
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to start checkout.',
      )
      setLoading(false)
    }
  }

  if (active) {
    return (
      <div className="mt-5 flex items-center gap-2 text-sm font-medium">
        <ShieldCheck className="size-4" />
        Subscription active
      </div>
    )
  }

  return (
    <div className="mt-5 space-y-3">
      {!quote ? (
        <Button
          type="button"
          onClick={reviewPayment}
          disabled={loading}
          className="w-full rounded-xl"
        >
          <CreditCard className="size-4" />
          {loading ? 'Preparing...' : 'Review subscription payment'}
        </Button>
      ) : (
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Confirm your one-month subscription
          </p>

          <p className="mt-2 text-sm">
            Official price:{' '}
            <strong>
              {formatMoney(quote.baseAmountCents, 'USD')}
            </strong>
          </p>

          <p className="mt-2 text-sm">
            Exact Paystack charge:{' '}
            <strong className="text-lg">
              {formatMoney(quote.amountMinor, 'GHS')}
            </strong>
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Exchange rate: 1 USD = {quote.exchangeRate.toFixed(4)} GHS
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {quote.renewalDisclosure}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Quote expires: {new Date(quote.expiresAt).toLocaleTimeString()}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={confirmPayment}
              disabled={loading}
              className="rounded-xl"
            >
              {loading ? 'Connecting...' : 'Confirm and Pay'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuote(null)
                setError('')
              }}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
