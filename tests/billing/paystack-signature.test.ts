import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { after, before, test } from 'node:test'
import { verifyPaystackSignature } from '../../lib/billing/paystack'

const previousKey = process.env.PAYSTACK_SECRET_KEY
const testKey = 'sk_test_vidin_local_signature_test_only'

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
  data: { reference: 'vidin-payg-test-reference' },
})

function sign(body: string): string {
  return createHmac('sha512', testKey)
    .update(body, 'utf8')
    .digest('hex')
}

test('accepts a valid Paystack signature', () => {
  assert.equal(
    verifyPaystackSignature(payload, sign(payload)),
    true,
  )
})

test('rejects a missing signature', () => {
  assert.equal(verifyPaystackSignature(payload, null), false)
})

test('rejects a malformed signature', () => {
  assert.equal(verifyPaystackSignature(payload, 'invalid'), false)
})

test('rejects a tampered webhook body', () => {
  const tampered = payload.replace(
    'charge.success',
    'charge.failed',
  )

  assert.equal(
    verifyPaystackSignature(tampered, sign(payload)),
    false,
  )
})

test('rejects a signature created with another secret', () => {
  const wrongSignature = createHmac(
    'sha512',
    'another-test-secret',
  )
    .update(payload, 'utf8')
    .digest('hex')

  assert.equal(
    verifyPaystackSignature(payload, wrongSignature),
    false,
  )
})
