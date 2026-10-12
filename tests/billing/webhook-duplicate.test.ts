import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createWebhookHandler } from '../../app/api/billing/webhook/route'

const reference =
  'vidin-payg-12345678-1234-1234-1234-123456789abc'

test('repeated webhook deliveries use the same settlement identity', async () => {
  let verificationCalls = 0
  let settlementCalls = 0
  let simulatedCredits = 0

  const settledReferences = new Set<string>()
  const settlementArguments: unknown[] = []

  const transaction = {
    reference,
    transaction_type: 'minute_purchase',
    status: 'pending',
    amount_minor: 900,
    currency: 'GHS',
    purchased_seconds: 600,
    credited_at: null,
  }

  const fakeAdmin = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async single() {
                  return {
                    data: transaction,
                    error: null,
                  }
                },
              }
            },
          }
        },
      }
    },

    async rpc(name: string, args: {
      p_reference: string
      p_paystack_transaction_id: string
    }) {
      assert.equal(
        name,
        'settle_verified_paystack_purchase',
      )

      settlementCalls++
      settlementArguments.push(args)

      const identity =
        `${args.p_reference}:${args.p_paystack_transaction_id}`

      if (!settledReferences.has(identity)) {
        settledReferences.add(identity)
        simulatedCredits += 600
      }

      return { data: null, error: null }
    },
  }

  const handler = createWebhookHandler({
    createAdmin: () => fakeAdmin as never,
    verifySignature: () => true,
    verifyTransaction: (async () => {
      verificationCalls++

      return {
        id: 123456,
        reference,
        status: 'success',
        amount: 900,
        currency: 'GHS',
        paid_at: '2026-10-11T12:00:00Z',
      }
    }) as never,
  })

  function request() {
    return new Request(
      'http://localhost/api/billing/webhook',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          event: 'charge.success',
          data: { reference },
        }),
      },
    )
  }

  const first = await handler(request())
  const second = await handler(request())

  assert.equal(first.status, 200)
  assert.equal(second.status, 200)

  assert.equal(verificationCalls, 2)
  assert.equal(settlementCalls, 2)

  assert.deepEqual(
    settlementArguments[0],
    settlementArguments[1],
  )

  assert.equal(simulatedCredits, 600)

  console.log(
    'PASS: Duplicate deliveries retain one payment identity',
  )
})
