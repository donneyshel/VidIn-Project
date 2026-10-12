import assert from 'node:assert/strict'
import { test } from 'node:test'

test('webhook route exports a POST handler', async () => {
  const route = await import(
    '../../app/api/billing/webhook/route'
  )

  assert.equal(typeof route.POST, 'function')
  assert.equal(route.runtime, 'nodejs')
})
