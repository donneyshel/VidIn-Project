import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createWebhookHandler } from '../../app/api/billing/webhook/route'

const reference =
  'vidin-payg-12345678-1234-1234-1234-123456789abc'

type Scenario = {
  paymentStatus?: string
  paymentAmount?: number
  settlementFails?: boolean
}

function makeScenario(options: Scenario = {}) {
  let settlementCalls = 0
  let verificationCalls = 0

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

    async rpc() {
      settlementCalls++

      return {
        data: null,
        error: options.settlementFails
          ? { message: 'Simulated settlement failure' }
          : null,
      }
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
        status: options.paymentStatus ?? 'success',
        amount: options.paymentAmount ?? 900,
        currency: 'GHS',
        paid_at: '2026-10-11T12:00:00Z',
      }
    }) as never,
  })

  async function sendWebhook() {
    return handler(
      new Request('http://localhost/api/billing/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event: 'charge.success',
          data: { reference },
        }),
      }),
    )
  }

  return {
    sendWebhook,
    get settlementCalls() {
      return settlementCalls
    },
    get verificationCalls() {
      return verificationCalls
    },
  }
}

test('rejects an incorrect payment amount', async () => {
  const scenario = makeScenario({
    paymentAmount: 100,
  })

  const response = await scenario.sendWebhook()

  assert.equal(response.status, 422)
  assert.equal(scenario.verificationCalls, 1)
  assert.equal(scenario.settlementCalls, 0)
})

test('rejects a payment not marked successful', async () => {
  const scenario = makeScenario({
    paymentStatus: 'failed',
  })

  const response = await scenario.sendWebhook()

  assert.equal(response.status, 422)
  assert.equal(scenario.settlementCalls, 0)
})

test('returns 500 when database settlement fails', async () => {
  const scenario = makeScenario({
    settlementFails: true,
  })

  const response = await scenario.sendWebhook()

  assert.equal(response.status, 500)
  assert.equal(scenario.verificationCalls, 1)
  assert.equal(scenario.settlementCalls, 1)
})
