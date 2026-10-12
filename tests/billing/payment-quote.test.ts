import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  createPaymentQuote,
  verifyPaymentQuote,
} from '@/lib/billing/payment-quote'

const originalFetch = globalThis.fetch
const originalSecret = process.env.PAYSTACK_SECRET_KEY

before(() => {
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_VIDIN_FAKE_PAYMENT_QUOTE_KEY'

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

test('creates and verifies a valid USD-to-GHS payment quote', async () => {
  const { quote, token } = await createPaymentQuote('customer-a', 100)
  const verified = verifyPaymentQuote(token, 'customer-a')

  assert.equal(quote.usdCents, 900)
  assert.equal(quote.amountMinor, 10800)
  assert.equal(quote.currency, 'GHS')
  assert.equal(verified.minutes, 100)
  assert.equal(verified.amountMinor, quote.amountMinor)
})

test('rejects a quote belonging to another customer', async () => {
  const { token } = await createPaymentQuote('customer-a', 60)

  assert.throws(() => {
    verifyPaymentQuote(token, 'customer-b')
  })
})

test('rejects a modified quote signature', async () => {
  const { token } = await createPaymentQuote('customer-a', 60)
  const [payload, signature] = token.split('.')

  const changedSignature =
    signature[0] === 'a'
      ? 'b' + signature.slice(1)
      : 'a' + signature.slice(1)

  assert.throws(() => {
    verifyPaymentQuote(
      `${payload}.${changedSignature}`,
      'customer-a',
    )
  })
})

test('rejects a modified quote amount', async () => {
  const { token } = await createPaymentQuote('customer-a', 60)
  const [payload, signature] = token.split('.')

  const modified = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf8'),
  )

  modified.amountMinor = 1

  const changedPayload = Buffer.from(
    JSON.stringify(modified),
  ).toString('base64url')

  assert.throws(() => {
    verifyPaymentQuote(
      `${changedPayload}.${signature}`,
      'customer-a',
    )
  })
})

test('rejects an expired quote', async () => {
  const originalNow = Date.now
  const { token } = await createPaymentQuote('customer-a', 60)

  try {
    Date.now = () => originalNow() + 6 * 60 * 1000

    assert.throws(() => {
      verifyPaymentQuote(token, 'customer-a')
    })
  } finally {
    Date.now = originalNow
  }
})

test('rejects invalid purchase quantities', async () => {
  await assert.rejects(
    createPaymentQuote('customer-a', 0),
  )

  await assert.rejects(
    createPaymentQuote('customer-a', 1001),
  )

  await assert.rejects(
    createPaymentQuote('customer-a', 1.5),
  )
})
