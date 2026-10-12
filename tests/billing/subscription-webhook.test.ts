import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { createWebhookHandler } from '@/app/api/billing/webhook/route'

const secret = 'sk_test_VIDIN_FAKE_WEBHOOK_KEY'
const reference = 'vidin-sub-12345678-1234-1234-1234-123456789abc'

type Product = 'creators' | 'live'

function makeHarness(options: {
  product?: Product
  storedAmount?: number
  verifiedAmount?: number
  transactionType?: string
  purchasedSeconds?: number | null
  settlementError?: boolean
} = {}) {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = []

  const storedAmount = options.storedAmount ?? 35988
  const verifiedAmount = options.verifiedAmount ?? storedAmount

  const admin = {
    from(table: string) {
      assert.equal(table, 'paystack_transactions')

      return {
        select() {
          return {
            eq(column: string, value: string) {
              assert.equal(column, 'reference')
              assert.equal(value, reference)

              return {
                async single() {
                  return {
                    data: {
                      reference,
                      transaction_type:
                        options.transactionType ?? 'subscription',
                      status: 'pending',
                      amount_minor: storedAmount,
                      currency: 'GHS',
                      purchased_seconds:
                        options.purchasedSeconds === undefined
                          ? null
                          : options.purchasedSeconds,
                      subscription_product: options.product ?? 'creators',
                      credited_at: null,
                    },
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },

    async rpc(name: string, args: Record<string, unknown>) {
      calls.push({ name, args })

      return {
        data: null,
        error: options.settlementError
          ? { message: 'Simulated settlement failure' }
          : null,
      }
    },
  }

  const handler = createWebhookHandler({
    createAdmin: () => admin as never,
    verifySignature: (body, signature) => {
      const expected = createHmac('sha512', secret)
        .update(body)
        .digest('hex')

      return signature === expected
    },
    verifyTransaction: async () => ({
      id: 123456,
      reference,
      status: 'success',
      amount: verifiedAmount,
      currency: 'GHS',
      paid_at: new Date().toISOString(),
    }) as never,
  })

  async function deliver(validSignature = true) {
    const body = JSON.stringify({
      event: 'charge.success',
      data: { reference },
    })

    const signature = validSignature
      ? createHmac('sha512', secret).update(body).digest('hex')
      : '0'.repeat(128)

    return handler(
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': signature,
        },
        body,
      }),
    )
  }

  return { calls, deliver }
}

test('verified Creators Vault payment invokes subscription settlement', async () => {
  const harness = makeHarness()
  const response = await harness.deliver()

  assert.equal(response.status, 200)
  assert.equal(harness.calls.length, 1)
  assert.equal(
    harness.calls[0].name,
    'settle_verified_paystack_subscription',
  )
  assert.equal(harness.calls[0].args.p_amount_minor, 35988)
  assert.equal(harness.calls[0].args.p_currency, 'GHS')
})

test('verified Live Ecosystem payment invokes subscription settlement', async () => {
  const harness = makeHarness({
    product: 'live',
    storedAmount: 59988,
  })

  const response = await harness.deliver()

  assert.equal(response.status, 200)
  assert.equal(harness.calls.length, 1)
  assert.equal(
    harness.calls[0].name,
    'settle_verified_paystack_subscription',
  )
})

test('incorrect subscription amount never reaches settlement', async () => {
  const harness = makeHarness({ verifiedAmount: 1 })
  const response = await harness.deliver()

  assert.equal(response.status, 422)
  assert.equal(harness.calls.length, 0)
})

test('forged webhook signature never reaches settlement', async () => {
  const harness = makeHarness()
  const response = await harness.deliver(false)

  assert.equal(response.status, 401)
  assert.equal(harness.calls.length, 0)
})

test('duplicate webhook deliveries use the same payment identity', async () => {
  const harness = makeHarness()

  const first = await harness.deliver()
  const second = await harness.deliver()

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)
  assert.equal(harness.calls.length, 2)

  assert.equal(
    harness.calls[0].args.p_paystack_transaction_id,
    harness.calls[1].args.p_paystack_transaction_id,
  )

  assert.equal(
    harness.calls[0].args.p_reference,
    harness.calls[1].args.p_reference,
  )
})

test('mismatched transaction type is rejected', async () => {
  const harness = makeHarness({
    transactionType: 'minute_purchase',
  })

  const response = await harness.deliver()

  assert.equal(response.status, 400)
  assert.equal(harness.calls.length, 0)
})

test('subscription transactions cannot contain purchased minutes', async () => {
  const harness = makeHarness({ purchasedSeconds: 60 })
  const response = await harness.deliver()

  assert.equal(response.status, 400)
  assert.equal(harness.calls.length, 0)
})

test('database settlement failure returns retryable error', async () => {
  const harness = makeHarness({ settlementError: true })
  const response = await harness.deliver()

  assert.equal(response.status, 500)
  assert.equal(harness.calls.length, 1)
})
