import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createConversationBranch,
  type BranchInsertClient,
  type CreatedConversationBranch,
} from './create-conversation-branch'
import type { PreparedConversationEdit } from './prepare-conversation-edit'

const prepared: PreparedConversationEdit = {
  conversation_id: 'conversation-1',
  user_id: 'user-1',
  parent_branch_id: null,
  fork_message_id: 'message-1',
  revised_question: 'What happens in the opening scene?',
}

function makeClient(
  result: {
    data: CreatedConversationBranch | null
    error: unknown
  },
) {
  let inserted: Record<string, unknown> | null = null

  const client = {
    from(table: string) {
      assert.equal(table, 'conversation_branches')

      return {
        insert(values: Record<string, unknown>) {
          inserted = values

          return {
            select(columns: string) {
              assert.match(columns, /fork_message_id/)

              return {
                async single() {
                  return result
                },
              }
            },
          }
        },
      }
    },
  }

  return {
    client: client as BranchInsertClient,
    getInserted: () => inserted,
  }
}

function validBranch(
  overrides: Partial<CreatedConversationBranch> = {},
): CreatedConversationBranch {
  return {
    id: 'branch-new',
    conversation_id: prepared.conversation_id,
    user_id: prepared.user_id,
    parent_branch_id: prepared.parent_branch_id,
    fork_message_id: prepared.fork_message_id,
    ...overrides,
  }
}

test('creates a root-level branch for an original question', async () => {
  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  const result = await createConversationBranch(
    mock.client,
    prepared,
  )

  assert.equal(result.id, 'branch-new')
  assert.deepEqual(mock.getInserted(), {
    conversation_id: 'conversation-1',
    user_id: 'user-1',
    parent_branch_id: null,
    fork_message_id: 'message-1',
  })
})

test('creates a nested branch with the correct parent', async () => {
  const nested = {
    ...prepared,
    parent_branch_id: 'branch-parent',
  }

  const mock = makeClient({
    data: validBranch({
      parent_branch_id: 'branch-parent',
    }),
    error: null,
  })

  const result = await createConversationBranch(
    mock.client,
    nested,
  )

  assert.equal(result.parent_branch_id, 'branch-parent')
  assert.equal(
    mock.getInserted()?.parent_branch_id,
    'branch-parent',
  )
})

test('rejects a database insertion error', async () => {
  const mock = makeClient({
    data: null,
    error: { message: 'Database unavailable' },
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Conversation branch creation failed/,
  )
})

test('rejects a missing inserted record', async () => {
  const mock = makeClient({
    data: null,
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Conversation branch creation failed/,
  )
})

test('rejects a branch returned for another user', async () => {
  const mock = makeClient({
    data: validBranch({ user_id: 'another-user' }),
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Created conversation branch verification failed/,
  )
})

test('rejects a branch returned for another conversation', async () => {
  const mock = makeClient({
    data: validBranch({
      conversation_id: 'another-conversation',
    }),
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Created conversation branch verification failed/,
  )
})

test('rejects a mismatched parent branch', async () => {
  const mock = makeClient({
    data: validBranch({
      parent_branch_id: 'unexpected-parent',
    }),
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Created conversation branch verification failed/,
  )
})

test('rejects a mismatched fork message', async () => {
  const mock = makeClient({
    data: validBranch({
      fork_message_id: 'another-message',
    }),
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Created conversation branch verification failed/,
  )
})

test('rejects a missing returned branch ID', async () => {
  const mock = makeClient({
    data: validBranch({ id: '' }),
    error: null,
  })

  await assert.rejects(
    createConversationBranch(mock.client, prepared),
    /Created conversation branch verification failed/,
  )
})

test('rejects an empty revised question before database access', async () => {
  let accessed = false

  const client = {
    from() {
      accessed = true
      throw new Error('Database should not be accessed')
    },
  }

  await assert.rejects(
    createConversationBranch(
      client as BranchInsertClient,
      { ...prepared, revised_question: '   ' },
    ),
    /Invalid prepared conversation edit/,
  )

  assert.equal(accessed, false)
})

test('does not mutate the prepared edit', async () => {
  const before = JSON.stringify(prepared)

  const mock = makeClient({
    data: validBranch(),
    error: null,
  })

  await createConversationBranch(mock.client, prepared)

  assert.equal(JSON.stringify(prepared), before)
})
