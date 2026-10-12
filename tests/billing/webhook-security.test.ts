import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { after, before, test } from 'node:test'
import { POST } from '../../app/api/billing/webhook/route'

const previousKey = process.env.PAYSTACK_SECRET_KEY
const testKey = 'sk_test_vidin_webhook_security_only'

before(() => {
  process.env.PAYSTACK_SECRET_KEY = testKey
})

after(() => {
  if (previousKey === undefined) {
    delete process.env.PAYSTACK_SECRET_KEY
  } else {
    process.env.PAYSTACK_SECRET_KEY = previousKey
  }
})

const payload = JSON.stringify({
  event: 'charge.success',
  data: {
    reference:
      'vidin-payg-12345678-1234-1234-1234-123456789abc',
  },
})

function signedRequest(
  body: string,
  signature?: string,
): Request {
  const headers = new Headers({
    'content-type': 'application/json',
  })

  if (signature !== undefined) {
    headers.set('x-paystack-signature', signature)
  }

  return new Request('http://localhost/api/billing/webhook', {
    method: 'POST',
    headers,
    body,
  })
}

test('rejects a missing Paystack signature', async () => {
  const response = await POST(signedRequest(payload))

  assert.equal(response.status, 401)
})

test('rejects a forged Paystack signature', async () => {
  const signature = createHmac(
    'sha512',
    'incorrect-secret',
  )
    .update(payload)
    .digest('hex')

  const response = await POST(
    signedRequest(payload, signature),
  )

  assert.equal(response.status, 401)
})

test('rejects an oversized webhook payload', async () => {
  const response = await POST(
    signedRequest('x'.repeat(100_001)),
  )

  assert.equal(response.status, 413)
})

test('rejects malformed JSON with a valid signature', async () => {
  const body = '{invalid-json'

  const signature = createHmac('sha512', testKey)
    .update(body)
    .digest('hex')

  const response = await POST(
    signedRequest(body, signature),
  )

  assert.equal(response.status, 400)
})
