import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import {
  getSubscriptionUsdCents,
  isSubscriptionProduct,
  type SubscriptionProduct,
} from '@/lib/billing/subscription-pricing'
import {
  convertUsdCentsToMinorUnits,
  getUsdExchangeRates,
} from '@/lib/billing/exchange-rates'

const QUOTE_LIFETIME_MS = 5 * 60 * 1000

export type SubscriptionQuote = {
  userId: string
  product: SubscriptionProduct
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
    throw new Error('Subscription quote signing key is unavailable.')
  }

  return key
}

function signature(payload: string): string {
  return createHmac('sha256', signingKey())
    .update(payload)
    .digest('hex')
}

export async function createSubscriptionQuote(
  userId: string,
  product: SubscriptionProduct,
): Promise<{ quote: SubscriptionQuote; token: string }> {
  if (!userId || !isSubscriptionProduct(product)) {
    throw new Error('Valid customer and subscription are required.')
  }

  const usdCents = getSubscriptionUsdCents(product)
  const rates = await getUsdExchangeRates()
  const usdToGhsRate = rates.rates.GHS
  const amountMinor = convertUsdCentsToMinorUnits(
    usdCents,
    usdToGhsRate,
  )

  const quote: SubscriptionQuote = {
    userId,
    product,
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

export function verifySubscriptionQuote(
  token: string,
  userId: string,
): SubscriptionQuote {
  if (
    typeof token !== 'string' ||
    token.length > 4096 ||
    !/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/.test(token)
  ) {
    throw new Error('Invalid subscription quote.')
  }

  const [payload, suppliedSignature] = token.split('.')
  const expectedSignature = signature(payload)

  if (!timingSafeEqual(
    Buffer.from(suppliedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  )) {
    throw new Error('Subscription quote signature mismatch.')
  }

  let quote: SubscriptionQuote

  try {
    quote = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as SubscriptionQuote
  } catch {
    throw new Error('Malformed subscription quote.')
  }

  if (
    !quote ||
    quote.userId !== userId ||
    !isSubscriptionProduct(quote.product) ||
    !Number.isSafeInteger(quote.expiresAt) ||
    quote.expiresAt <= Date.now() ||
    quote.expiresAt > Date.now() + QUOTE_LIFETIME_MS ||
    quote.currency !== 'GHS' ||
    !Number.isFinite(quote.usdToGhsRate) ||
    quote.usdToGhsRate <= 0 ||
    !Number.isSafeInteger(quote.amountMinor) ||
    quote.amountMinor <= 0 ||
    quote.usdCents !== getSubscriptionUsdCents(quote.product) ||
    quote.amountMinor !== convertUsdCentsToMinorUnits(
      quote.usdCents,
      quote.usdToGhsRate,
    ) ||
    typeof quote.rateUpdatedAt !== 'string' ||
    !Number.isFinite(Date.parse(quote.rateUpdatedAt))
  ) {
    throw new Error('Subscription quote is invalid or expired.')
  }

  return quote
}
