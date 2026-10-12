import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { after, before, test } from 'node:test'
import {
  createSubscriptionQuote,
  verifySubscriptionQuote,
} from '@/lib/billing/subscription-quote'

const originalFetch = globalThis.fetch
const originalSecret = process.env.PAYSTACK_SECRET_KEY

const secret = 'sk_test_VIDIN_FAKE_SUBSCRIPTION_QUOTE_KEY'
const customer = 'subscription-test-customer'

before(() => {
  process.env.PAYSTACK_SECRET_KEY = secret

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        result: 'success',
        base_code: 'USD',
        time_last_update_unix: Math.floor(Date.now() / 1000),
        rates: {
          USD: 1,
          GHS: 12,
          EUR: 0.9,
          GBP: 0.8,
        },
      }),
      { status: 200 },
    )
})

after(() => {
  globalThis.fetch = originalFetch

  if (originalSecret === undefined) {
    delete process.env.PAYSTACK_SECRET_KEY
  } else {
    process.env.PAYSTACK_SECRET_KEY = originalSecret
  }
})

function resign(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(encoded)
    .digest('hex')

  return `${encoded}.${signature}`
}

test('creates a valid Creators Vault quote at $29.99', async () => {
  const { quote, token } = await createSubscriptionQuote(
    customer,
    'creators',
  )

  assert.equal(quote.product, 'creators')
  assert.equal(quote.usdCents, 2999)
  assert.equal(quote.amountMinor, 35988)
  assert.equal(quote.currency, 'GHS')
  assert.deepEqual(verifySubscriptionQuote(token, customer), quote)
})

test('creates a valid Live Ecosystem quote at $49.99', async () => {
  const { quote, token } = await createSubscriptionQuote(
    customer,
    'live',
  )

  assert.equal(quote.product, 'live')
  assert.equal(quote.usdCents, 4999)
  assert.equal(quote.amountMinor, 59988)
  assert.deepEqual(verifySubscriptionQuote(token, customer), quote)
})

test('rejects a quote belonging to another customer', async () => {
  const { token } = await createSubscriptionQuote(customer, 'creators')

  assert.throws(() =>
    verifySubscriptionQuote(token, 'another-customer'),
  )
})

test('rejects a tampered signature', async () => {
  const { token } = await createSubscriptionQuote(customer, 'creators')
  const [payload] = token.split('.')

  assert.throws(() =>
    verifySubscriptionQuote(`${payload}.${'0'.repeat(64)}`, customer),
  )
})

test('rejects a modified amount even with a valid signature', async () => {
  const { quote } = await createSubscriptionQuote(customer, 'creators')

  assert.throws(() =>
    verifySubscriptionQuote(
      resign({ ...quote, amountMinor: 1 }),
      customer,
    ),
  )
})

test('rejects an expired quote', async () => {
  const { quote } = await createSubscriptionQuote(customer, 'creators')

  assert.throws(() =>
    verifySubscriptionQuote(
      resign({ ...quote, expiresAt: Date.now() - 1000 }),
      customer,
    ),
  )
})

test('rejects invalid subscription products and prices', async () => {
  const { quote } = await createSubscriptionQuote(customer, 'creators')

  assert.throws(() =>
    verifySubscriptionQuote(
      resign({ ...quote, product: 'unknown' }),
      customer,
    ),
  )

  assert.throws(() =>
    verifySubscriptionQuote(
      resign({ ...quote, product: 'live' }),
      customer,
    ),
  )

  await assert.rejects(
    createSubscriptionQuote(customer, 'invalid' as 'creators'),
  )
})
