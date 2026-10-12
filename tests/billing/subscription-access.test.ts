import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'

const now = new Date('2026-10-11T12:00:00.000Z')

test('allows active subscription with a future expiry', () => {
  assert.equal(
    hasActiveSubscription(
      {
        status: 'active',
        current_period_end: '2026-11-11T12:00:00.000Z',
      },
      now,
    ),
    true,
  )
})

test('denies an expired active subscription', () => {
  assert.equal(
    hasActiveSubscription(
      {
        status: 'active',
        current_period_end: '2026-10-10T12:00:00.000Z',
      },
      now,
    ),
    false,
  )
})

test('denies a cancelled subscription', () => {
  assert.equal(
    hasActiveSubscription(
      {
        status: 'cancelled',
        current_period_end: '2026-11-11T12:00:00.000Z',
      },
      now,
    ),
    false,
  )
})

test('denies a past-due subscription', () => {
  assert.equal(
    hasActiveSubscription(
      {
        status: 'past_due',
        current_period_end: '2026-11-11T12:00:00.000Z',
      },
      now,
    ),
    false,
  )
})

test('denies missing subscription or expiry', () => {
  assert.equal(hasActiveSubscription(null, now), false)

  assert.equal(
    hasActiveSubscription(
      {
        status: 'active',
        current_period_end: null,
      },
      now,
    ),
    false,
  )
})

test('denies invalid or exactly expired billing periods', () => {
  assert.equal(
    hasActiveSubscription(
      {
        status: 'active',
        current_period_end: 'invalid-date',
      },
      now,
    ),
    false,
  )

  assert.equal(
    hasActiveSubscription(
      {
        status: 'active',
        current_period_end: now.toISOString(),
      },
      now,
    ),
    false,
  )
})
