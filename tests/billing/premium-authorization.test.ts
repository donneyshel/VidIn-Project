import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkPremiumAccess } from '@/lib/billing/require-premium-access'
import type { SubscriptionProduct } from '@/lib/billing/subscription-pricing'

type MockOptions = {
  authenticated?: boolean
  status?: string
  expiresAt?: string | null
  databaseError?: boolean
  storedProduct?: SubscriptionProduct
}

function makeHarness(options: MockOptions = {}) {
  const queries: Array<{ column: string; value: string }> = []

  const user = options.authenticated === false
    ? null
    : { id: 'test-user-123' }

  const supabase = {
    auth: {
      async getUser() {
        return {
          data: { user },
          error: null,
        }
      },
    },
    from(table: string) {
      assert.equal(table, 'subscriptions')

      return {
        select(columns: string) {
          assert.equal(columns, 'status, current_period_end')

          const query = {
            eq(column: string, value: string) {
              queries.push({ column, value })
              return query
            },
            async maybeSingle() {
              if (options.databaseError) {
                return {
                  data: null,
                  error: { code: 'TEST_DATABASE_ERROR' },
                }
              }

              if (options.status === undefined) {
                return { data: null, error: null }
              }

              const requestedProduct = queries.find(
                (entry) => entry.column === 'product',
              )?.value

              if (
                options.storedProduct &&
                requestedProduct !== options.storedProduct
              ) {
                return { data: null, error: null }
              }

              return {
                data: {
                  status: options.status,
                  current_period_end: options.expiresAt ??
                    '2099-01-01T00:00:00.000Z',
                },
                error: null,
              }
            },
          }

          return query
        },
      }
    },
  }

  return {
    queries,
    supabase: supabase as never,
  }
}

async function deniedStatus(
  product: SubscriptionProduct,
  options: MockOptions,
) {
  const harness = makeHarness(options)
  const result = await checkPremiumAccess(product, harness.supabase)

  assert.equal(result.authorized, false)

  if (result.authorized) {
    throw new Error('Unexpected authorization')
  }

  return { status: result.response.status, queries: harness.queries }
}

test('unauthenticated users receive HTTP 401', async () => {
  const result = await deniedStatus('creators', {
    authenticated: false,
  })

  assert.equal(result.status, 401)
  assert.equal(result.queries.length, 0)
})

test('missing subscriptions receive HTTP 403', async () => {
  const result = await deniedStatus('creators', {})

  assert.equal(result.status, 403)
})

test('expired subscriptions receive HTTP 403', async () => {
  const result = await deniedStatus('creators', {
    status: 'active',
    expiresAt: '2020-01-01T00:00:00.000Z',
  })

  assert.equal(result.status, 403)
})

test('cancelled subscriptions receive HTTP 403', async () => {
  const result = await deniedStatus('live', {
    status: 'cancelled',
  })

  assert.equal(result.status, 403)
})

test('Creators subscription cannot unlock Live Ecosystem', async () => {
  const result = await deniedStatus('live', {
    status: 'active',
    storedProduct: 'creators',
  })

  assert.equal(result.status, 403)
  assert.ok(
    result.queries.some(
      (entry) => entry.column === 'product' &&
        entry.value === 'live',
    ),
  )
})

test('database errors fail closed with HTTP 503', async () => {
  const originalError = console.error
  console.error = () => {}

  try {
    const result = await deniedStatus('creators', {
      databaseError: true,
    })

    assert.equal(result.status, 503)
  } finally {
    console.error = originalError
  }
})

test('valid subscription grants product-specific access', async () => {
  const harness = makeHarness({
    status: 'active',
    storedProduct: 'creators',
  })

  const result = await checkPremiumAccess(
    'creators',
    harness.supabase,
  )

  assert.equal(result.authorized, true)

  if (!result.authorized) {
    throw new Error('Expected authorization')
  }

  assert.equal(result.userId, 'test-user-123')
  assert.ok(
    harness.queries.some(
      (entry) => entry.column === 'user_id' &&
        entry.value === 'test-user-123',
    ),
  )
  assert.ok(
    harness.queries.some(
      (entry) => entry.column === 'product' &&
        entry.value === 'creators',
    ),
  )
})
