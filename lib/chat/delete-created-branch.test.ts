import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deleteCreatedBranch,
  type BranchDeleteClient,
  type BranchDeleteResult,
  type DeletedBranch,
} from './delete-created-branch'

const identity = {
  branchId: 'branch-new',
  conversationId: 'conversation-1',
  userId: 'user-1',
}

function validBranch(
  overrides: Partial<DeletedBranch> = {},
): DeletedBranch {
  return {
    id: identity.branchId,
    conversation_id: identity.conversationId,
    user_id: identity.userId,
    ...overrides,
  }
}

function makeClient(result: BranchDeleteResult) {
  const filters: Array<[string, string]> = []
  let deleteCalls = 0

  const query = {
    eq(column: string, value: string) {
      filters.push([column, value])
      return query
    },
    select(columns: string) {
      assert.equal(columns, 'id,conversation_id,user_id')

      return {
        async maybeSingle() {
          return result
        },
      }
    },
  }

  const client = {
    from(table: string) {
      assert.equal(table, 'conversation_branches')

      return {
        delete() {
          deleteCalls++
          return query
        },
      }
    },
  }

  return {
    client: client as BranchDeleteClient,
    filters,
    getDeleteCalls: () => deleteCalls,
  }
}

async function perform(
  client: BranchDeleteClient,
  overrides: Partial<typeof identity> = {},
) {
  const values = { ...identity, ...overrides }

  return deleteCreatedBranch(
    client,
    values.branchId,
    values.conversationId,
    values.userId,
  )
}

test('deletes the intended newly created branch', async () => {
  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  const result = await perform(mock.client)

  assert.deepEqual(result, { error: null })
  assert.equal(mock.getDeleteCalls(), 1)
  assert.deepEqual(mock.filters, [
    ['id', 'branch-new'],
    ['conversation_id', 'conversation-1'],
    ['user_id', 'user-1'],
  ])
})

test('rejects a zero-row deletion', async () => {
  const mock = makeClient({
    data: null,
    error: null,
  })

  await assert.rejects(
    perform(mock.client),
    /no branch was deleted/,
  )
})

test('rejects database deletion errors', async () => {
  const mock = makeClient({
    data: null,
    error: { message: 'Foreign key restriction' },
  })

  await assert.rejects(
    perform(mock.client),
    /Conversation branch cleanup failed/,
  )
})

test('rejects another branch ID returned by the database', async () => {
  const mock = makeClient({
    data: validBranch({ id: 'another-branch' }),
    error: null,
  })

  await assert.rejects(
    perform(mock.client),
    /identity verification failed/,
  )
})

test('rejects another conversation returned by the database', async () => {
  const mock = makeClient({
    data: validBranch({
      conversation_id: 'another-conversation',
    }),
    error: null,
  })

  await assert.rejects(
    perform(mock.client),
    /identity verification failed/,
  )
})

test('rejects another user returned by the database', async () => {
  const mock = makeClient({
    data: validBranch({ user_id: 'another-user' }),
    error: null,
  })

  await assert.rejects(
    perform(mock.client),
    /identity verification failed/,
  )
})

test('rejects missing branch ID before database access', async () => {
  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  await assert.rejects(
    perform(mock.client, { branchId: '   ' }),
    /Invalid branch cleanup identity/,
  )

  assert.equal(mock.getDeleteCalls(), 0)
})

test('rejects missing conversation ID before database access', async () => {
  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  await assert.rejects(
    perform(mock.client, { conversationId: '   ' }),
    /Invalid branch cleanup identity/,
  )

  assert.equal(mock.getDeleteCalls(), 0)
})

test('rejects missing user ID before database access', async () => {
  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  await assert.rejects(
    perform(mock.client, { userId: '   ' }),
    /Invalid branch cleanup identity/,
  )

  assert.equal(mock.getDeleteCalls(), 0)
})

test('propagates an unexpected database exception', async () => {
  const client = {
    from() {
      throw new Error('Connection unavailable')
    },
  } as unknown as BranchDeleteClient

  await assert.rejects(
    perform(client),
    /Connection unavailable/,
  )
})

test('does not modify the requested cleanup identities', async () => {
  const before = JSON.stringify(identity)

  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  await perform(mock.client)

  assert.equal(JSON.stringify(identity), before)
})
