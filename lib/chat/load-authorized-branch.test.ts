import assert from 'node:assert/strict'
import test from 'node:test'
import {
  loadAuthorizedBranch,
  type BranchLookupClient,
  type BranchRecord,
} from './load-authorized-branch'

const context = {
  userId: 'user-1',
  conversationId: 'conversation-1',
  recordingId: 'recording-1',
}

const validBranch: BranchRecord = {
  id: 'branch-1',
  conversation_id: 'conversation-1',
  user_id: 'user-1',
  parent_branch_id: null,
  fork_message_id: 'message-1',
}

function mockClient(
  data: BranchRecord | null,
  error: unknown = null,
) {
  const filters: Array<[string, string]> = []
  let selectedTable = ''
  let selectedColumns = ''

  const query = {
    eq(column: string, value: string) {
      filters.push([column, value])
      return this
    },
    async maybeSingle() {
      return { data, error }
    },
  }

  const client = {
    from(table: string) {
      selectedTable = table
      return {
        select(columns: string) {
          selectedColumns = columns
          return query
        },
      }
    },
  } as BranchLookupClient

  return {
    client,
    filters,
    get selectedTable() {
      return selectedTable
    },
    get selectedColumns() {
      return selectedColumns
    },
  }
}

test('loads an authorized branch', async () => {
  const mock = mockClient(validBranch)

  const result = await loadAuthorizedBranch(
    mock.client,
    'branch-1',
    context,
  )

  assert.deepEqual(result, validBranch)
})

test('restricts lookup by branch, conversation, and user', async () => {
  const mock = mockClient(validBranch)

  await loadAuthorizedBranch(mock.client, 'branch-1', context)

  assert.equal(mock.selectedTable, 'conversation_branches')
  assert.deepEqual(mock.filters, [
    ['id', 'branch-1'],
    ['conversation_id', 'conversation-1'],
    ['user_id', 'user-1'],
  ])
  assert.match(mock.selectedColumns, /parent_branch_id/)
  assert.match(mock.selectedColumns, /fork_message_id/)
})

test('rejects a branch owned by another user', async () => {
  const mock = mockClient({
    ...validBranch,
    user_id: 'user-2',
  })

  await assert.rejects(
    loadAuthorizedBranch(mock.client, 'branch-1', context),
    /ownership verification failed/,
  )
})

test('rejects a branch from another conversation', async () => {
  const mock = mockClient({
    ...validBranch,
    conversation_id: 'conversation-2',
  })

  await assert.rejects(
    loadAuthorizedBranch(mock.client, 'branch-1', context),
    /ownership verification failed/,
  )
})

test('rejects a missing branch', async () => {
  const mock = mockClient(null)

  await assert.rejects(
    loadAuthorizedBranch(mock.client, 'branch-1', context),
    /ownership verification failed/,
  )
})

test('rejects database lookup errors', async () => {
  const mock = mockClient(null, { message: 'Database unavailable' })

  await assert.rejects(
    loadAuthorizedBranch(mock.client, 'branch-1', context),
    /branch lookup failed/,
  )
})

test('rejects an empty branch ID before querying', async () => {
  const mock = mockClient(validBranch)

  await assert.rejects(
    loadAuthorizedBranch(mock.client, '   ', context),
    /branch ID is required/,
  )

  assert.equal(mock.filters.length, 0)
})


test('rejects a different branch ID returned by the database', async () => {
  const context = {
    userId: 'user-1',
    conversationId: 'conversation-1',
    recordingId: 'recording-1',
  }

  const client = {
    from() {
      const query = {
        select() { return query },
        eq() { return query },
        async maybeSingle() {
          return {
            data: {
              id: 'wrong-branch',
              conversation_id: context.conversationId,
              user_id: context.userId,
              parent_branch_id: null,
              fork_message_id: 'message-1',
            },
            error: null,
          }
        },
      }

      return query
    },
  }

  await assert.rejects(
    loadAuthorizedBranch(
      client as never,
      'requested-branch',
      context,
    ),
    /Conversation branch identity mismatch/,
  )
})
