import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const PAYSTACK_API_URL = 'https://api.paystack.co'

function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim()

  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured.')
  }

  return key
}

export async function paystackRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST'
    body?: Record<string, unknown>
  } = {},
): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Invalid Paystack API path.')
  }

  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(
      `Paystack request failed with HTTP ${response.status}.`,
    )
  }

  const result: unknown = await response.json()

  if (
    !result ||
    typeof result !== 'object' ||
    !('status' in result) ||
    result.status !== true ||
    !('data' in result)
  ) {
    throw new Error('Paystack returned an unsuccessful response.')
  }

  return result.data as T
}

export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
    return false
  }

  const expected = createHmac('sha512', getPaystackSecretKey())
    .update(rawBody, 'utf8')
    .digest()

  const received = Buffer.from(signature, 'hex')

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  )
}
