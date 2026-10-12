import 'server-only'

const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/USD'
const CACHE_DURATION_MS = 30 * 60 * 1000
const MAX_RATE_AGE_MS = 48 * 60 * 60 * 1000

type ExchangeRateResponse = {
  result?: string
  base_code?: string
  time_last_update_unix?: number
  rates?: Record<string, number>
}

export type ExchangeRateSnapshot = {
  baseCurrency: 'USD'
  updatedAt: string
  rates: Record<string, number>
}

let cachedSnapshot: ExchangeRateSnapshot | null = null
let cacheExpiresAt = 0

export async function getUsdExchangeRates(): Promise<ExchangeRateSnapshot> {
  if (cachedSnapshot && Date.now() < cacheExpiresAt) {
    return cachedSnapshot
  }

  const response = await fetch(EXCHANGE_RATE_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error('Exchange-rate provider is unavailable.')
  }

  const data = (await response.json()) as ExchangeRateResponse

  if (
    data.result !== 'success' ||
    data.base_code !== 'USD' ||
    !Number.isFinite(data.time_last_update_unix)
  ) {
    throw new Error('Invalid exchange-rate provider response.')
  }

  const updatedAtMs = Number(data.time_last_update_unix) * 1000
  const ageMs = Date.now() - updatedAtMs

  if (
    ageMs < -5 * 60 * 1000 ||
    ageMs > MAX_RATE_AGE_MS
  ) {
    throw new Error('Exchange rates are outside the permitted age window.')
  }

  if (
    !data.rates ||
    typeof data.rates !== 'object' ||
    !Number.isFinite(data.rates.USD) ||
    data.rates.USD !== 1 ||
    !Number.isFinite(data.rates.GHS) ||
    data.rates.GHS <= 0
  ) {
    throw new Error('Required exchange rates are missing or invalid.')
  }

  const validatedRates: Record<string, number> = {}

  for (const [currency, rate] of Object.entries(data.rates)) {
    if (
      /^[A-Z]{3}$/.test(currency) &&
      typeof rate === 'number' &&
      Number.isFinite(rate) &&
      rate > 0
    ) {
      validatedRates[currency] = rate
    }
  }

  const snapshot: ExchangeRateSnapshot = {
    baseCurrency: 'USD',
    updatedAt: new Date(updatedAtMs).toISOString(),
    rates: validatedRates,
  }

  cachedSnapshot = snapshot
  cacheExpiresAt = Date.now() + CACHE_DURATION_MS

  return snapshot
}

export function convertUsdCentsToMinorUnits(
  usdCents: number,
  rate: number,
): number {
  if (
    !Number.isSafeInteger(usdCents) ||
    usdCents <= 0 ||
    !Number.isFinite(rate) ||
    rate <= 0
  ) {
    throw new Error('Invalid currency conversion inputs.')
  }

  const amountMinor = Math.round(usdCents * rate)

  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Invalid converted payment amount.')
  }

  return amountMinor
}
