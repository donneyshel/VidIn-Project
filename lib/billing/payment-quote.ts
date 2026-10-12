import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { calculatePaygUsdCents } from '@/lib/billing/pricing'
import {
  convertUsdCentsToMinorUnits,
  getUsdExchangeRates,
} from '@/lib/billing/exchange-rates'

const QUOTE_LIFETIME_MS = 5 * 60 * 1000

export type PaymentQuote = {
  userId: string
  minutes: number
  usdCents: number
  amountMinor: number
  currency: 'GHS'
  usdToGhsRate: number
  rateUpdatedAt: string
  expiresAt: number
}

function signingKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY

  if (!key || !/^sk_(?:test|live)_/.test(key)) {
    throw new Error('Payment quote signing key is unavailable.')
  }

  return key
}

function signature(payload: string): string {
  return createHmac('sha256', signingKey())
    .update(payload)
    .digest('hex')
}

export async function createPaymentQuote(
  userId: string,
  minutes: number,
): Promise<{ quote: PaymentQuote; token: string }> {
  if (!userId) {
    throw new Error('An authenticated user is required.')
  }

  const usdCents = calculatePaygUsdCents(minutes)
  const rates = await getUsdExchangeRates()
  const usdToGhsRate = rates.rates.GHS
  const amountMinor = convertUsdCentsToMinorUnits(
    usdCents,
    usdToGhsRate,
  )

  const quote: PaymentQuote = {
    userId,
    minutes,
    usdCents,
    amountMinor,
    currency: 'GHS',
    usdToGhsRate,
    rateUpdatedAt: rates.updatedAt,
    expiresAt: Date.now() + QUOTE_LIFETIME_MS,
  }

  const payload = Buffer.from(JSON.stringify(quote))
    .toString('base64url')

  return {
    quote,
    token: `${payload}.${signature(payload)}`,
  }
}

export function verifyPaymentQuote(
  token: string,
  userId: string,
): PaymentQuote {
  if (
    typeof token !== 'string' ||
    token.length > 4096 ||
    !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(token)
  ) {
    throw new Error('Invalid payment quote.')
  }

  const [payload, suppliedSignature] = token.split('.')
  const expectedSignature = signature(payload)

  if (!timingSafeEqual(
    Buffer.from(suppliedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  )) {
    throw new Error('Payment quote signature mismatch.')
  }

  const quote = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf8'),
  ) as PaymentQuote

  if (
    quote.userId !== userId ||
    !Number.isSafeInteger(quote.expiresAt) ||
    quote.expiresAt <= Date.now() ||
    quote.expiresAt > Date.now() + QUOTE_LIFETIME_MS ||
    quote.currency !== 'GHS' ||
    !Number.isFinite(quote.usdToGhsRate) ||
    quote.usdToGhsRate <= 0 ||
    !Number.isSafeInteger(quote.amountMinor) ||
    quote.amountMinor <= 0 ||
    quote.usdCents !== calculatePaygUsdCents(quote.minutes) ||
    quote.amountMinor !== convertUsdCentsToMinorUnits(
      quote.usdCents,
      quote.usdToGhsRate,
    ) ||
    !Number.isFinite(Date.parse(quote.rateUpdatedAt))
  ) {
    throw new Error('Payment quote is invalid or expired.')
  }

  return quote
}
