'use client'

import { useSyncExternalStore, useState } from 'react'
import { Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VIDIN_PRICING } from '@/lib/billing/pricing'

const presets = [60, 120, 300, 600]

type PaymentQuoteResponse = {
  quoteToken: string
  minutes: number
  usdCents: number
  amountMinor: number
  currency: 'GHS'
  usdToGhsRate: number
  rateUpdatedAt: string
  expiresAt: string
  displayRates: Record<string, number>
}

type DisplayCurrency = 'USD' | 'GHS' | 'EUR' | 'GBP'

const displayCurrencies: DisplayCurrency[] = [
  'USD',
  'GHS',
  'EUR',
  'GBP',
]

function suggestDisplayCurrency(): DisplayCurrency {
  const locale = navigator.language || 'en-US'
  const region = locale.split('-')[1]?.toUpperCase()

  if (region === 'GH') return 'GHS'
  if (region === 'GB') return 'GBP'

  if (
    [
      'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI',
      'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU',
      'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
    ].includes(region || '')
  ) {
    return 'EUR'
  }

  return 'USD'
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function CreditCalculator() {
  const [minutes, setMinutes] = useState(120)
  const [quote, setQuote] = useState<PaymentQuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [selectedCurrency, setSelectedCurrency] =
    useState<DisplayCurrency | null>(null)

  const browserReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const displayCurrency =
    selectedCurrency ??
    (browserReady ? suggestDisplayCurrency() : 'USD')

  function changeDisplayCurrency(currency: DisplayCurrency) {
    setSelectedCurrency(currency)
  }

  const usdCents = minutes * VIDIN_PRICING.paygUsdCentsPerMinute
  const hours = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)

  function changeMinutes(value: number) {
    if (isLoading) return
    setMinutes(value)
    setQuote(null)
    setCheckoutError('')
  }

  async function handleRequestQuote() {
    if (isLoading) return

    setIsLoading(true)
    setCheckoutError('')
    setQuote(null)

    try {
      const response = await fetch('/api/billing/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to calculate payment.')
      }

      const nextQuote = result as PaymentQuoteResponse

      if (
        typeof nextQuote.quoteToken !== 'string' ||
        nextQuote.minutes !== minutes ||
        nextQuote.usdCents !== usdCents ||
        nextQuote.currency !== 'GHS' ||
        !Number.isSafeInteger(nextQuote.amountMinor) ||
        nextQuote.amountMinor <= 0 ||
        !Number.isFinite(nextQuote.usdToGhsRate) ||
        nextQuote.usdToGhsRate <= 0 ||
        !Number.isFinite(Date.parse(nextQuote.expiresAt)) ||
        !nextQuote.displayRates ||
        nextQuote.displayRates.USD !== 1 ||
        nextQuote.displayRates.GHS !== nextQuote.usdToGhsRate
      ) {
        throw new Error('Invalid payment quote received.')
      }

      setQuote(nextQuote)
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to calculate payment.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmPayment() {
    if (!quote || isLoading) return

    if (Date.parse(quote.expiresAt) <= Date.now()) {
      setQuote(null)
      setCheckoutError('Your quote expired. Please request a new quote.')
      return
    }

    setIsLoading(true)
    setCheckoutError('')

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteToken: quote.quoteToken }),
      })

      const result: {
        authorizationUrl?: string
        amountMinor?: number
        currency?: string
        error?: string
      } = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to initialize checkout.')
      }

      if (
        result.amountMinor !== quote.amountMinor ||
        result.currency !== quote.currency
      ) {
        throw new Error('Checkout amount differs from your confirmed quote.')
      }

      if (!result.authorizationUrl) {
        throw new Error('Paystack checkout URL is missing.')
      }

      const checkoutUrl = new URL(result.authorizationUrl)

      if (
        checkoutUrl.protocol !== 'https:' ||
        !(
          checkoutUrl.hostname === 'checkout.paystack.com' ||
          checkoutUrl.hostname === 'paystack.com' ||
          checkoutUrl.hostname.endsWith('.paystack.com')
        )
      ) {
        throw new Error('Unexpected payment destination.')
      }

      window.location.assign(checkoutUrl.toString())
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to start checkout.',
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card glow-border rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Processing minutes
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {minutes}
            </span>
            <span className="text-sm text-muted-foreground">
              minutes · ~{hours}h
            </span>
          </div>

          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={minutes}
            disabled={isLoading}
            onChange={(event) => changeMinutes(Number(event.target.value))}
            aria-label="Processing minutes"
            className="mt-5 w-full accent-primary"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={isLoading}
                onClick={() => changeMinutes(preset)}
                className={
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (minutes === preset
                    ? 'border-white/25 bg-secondary text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground')
                }
              >
                {preset} min
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Official rate: $0.09 USD per minute.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-6 text-center lg:w-72">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Official USD total
          </p>

          <p className="mt-3 text-5xl font-semibold tracking-tight tabular-nums">
            {formatMoney(usdCents / 100, 'USD')}
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            {minutes} min × $0.09 USD
          </p>

          <div className="mt-5 text-left">
            <label
              htmlFor="vidin-display-currency"
              className="text-xs font-medium text-muted-foreground"
            >
              Display currency
            </label>

            <select
              id="vidin-display-currency"
              value={displayCurrency}
              onChange={(event) =>
                changeDisplayCurrency(event.target.value as DisplayCurrency)
              }
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {displayCurrencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>

            {quote && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Estimated amount in {displayCurrency}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatMoney(
                    (quote.usdCents / 100) *
                      (quote.displayRates[displayCurrency] || 1),
                    displayCurrency,
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Reference-rate estimate only. Paystack charges GHS.
                </p>
              </div>
            )}
          </div>

          {!quote ? (
            <Button
              className="mt-6 w-full rounded-xl"
              onClick={handleRequestQuote}
              disabled={isLoading}
            >
              <Sparkles className="size-4" />
              {isLoading ? 'Calculating...' : 'Review Payment'}
            </Button>
          ) : (
            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Exact Paystack charge
              </p>

              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {formatMoney(quote.amountMinor / 100, 'GHS')}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Exchange rate: 1 USD = {quote.usdToGhsRate.toFixed(4)} GHS
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Quote expires: {new Date(quote.expiresAt).toLocaleTimeString()}
              </p>

              <Button
                className="mt-4 w-full rounded-xl"
                onClick={handleConfirmPayment}
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Confirm and Pay'}
              </Button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => setQuote(null)}
                className="mt-3 w-full text-xs text-muted-foreground underline"
              >
                Change or refresh quote
              </button>
            </div>
          )}

          {checkoutError && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {checkoutError}
            </p>
          )}

          <p className="mt-3 text-[0.7rem] text-muted-foreground">
            Purchased minutes never expire. 10 free seconds every day.
          </p>
        </div>
      </div>
    </div>
  )
}
