import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createWebhookHandler } from '../../app/api/billing/webhook/route'

const reference =
  'vidin-payg-12345678-1234-1234-1234-123456789abc'

test('verified PAYG payment invokes atomic settlement', async () => {
  const calls: Array<{
    name: string
    details?: unknown
  }> = []

  const transaction = {
    reference,
    transaction_type: 'minute_purchase',
    status: 'pending',
    amount_minor: 900,
    currency: 'GHS',
    purchased_seconds: 600,
    credited_at: null,
  }

  const verified = {
    id: 123456,
    reference,
    status: 'success',
    amount: 900,
    currency: 'GHS',
    paid_at: '2026-10-11T12:00:00Z',
  }

  const fakeAdmin = {
    from(table: string) {
      calls.push({ name: 'from', details: table })

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

    async rpc(name: string, details: unknown) {
      calls.push({ name: 'rpc', details })

      return { data: null, error: null }
    },
  }

  const handler = createWebhookHandler({
    createAdmin: () => fakeAdmin as never,
    verifySignature: () => true,
    verifyTransaction: (async (path: string) => {
      calls.push({ name: 'verify', details: path })
      return verified
    }) as never,
  })

  const response = await handler(
    new Request('http://localhost/api/billing/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'charge.success',
        data: { reference },
      }),
    }),
  )

  assert.equal(response.status, 200)

  assert.deepEqual(
    calls.map((call) => call.name),
    ['from', 'verify', 'rpc'],
  )

  assert.equal(
    calls[1].details,
    `/transaction/verify/${reference}`,
  )

  assert.deepEqual(calls[2], {
    name: 'rpc',
    details: {
      p_reference: reference,
      p_amount_minor: 900,
      p_currency: 'GHS',
      p_paystack_transaction_id: '123456',
      p_paid_at: '2026-10-11T12:00:00Z',
    },
  })

  console.log(
    'PASS: Verified payment reaches atomic settlement',
  )
})
