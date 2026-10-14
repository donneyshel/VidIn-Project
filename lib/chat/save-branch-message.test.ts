import assert from 'node:assert/strict'
import test from 'node:test'
import {
  saveBranchMessage,
  type BranchMessageInsertClient,
  type SavedBranchMessage,
  type SaveBranchMessageInput,
} from './save-branch-message'

const input: SaveBranchMessageInput = {
  conversationId: 'conversation-1',
  userId: 'user-1',
  branchId: 'branch-1',
  role: 'user',
  content: 'What happens in the opening scene?',
}

function validMessage(
  overrides: Partial<SavedBranchMessage> = {},
): SavedBranchMessage {
  return {
    id: 'message-new',
    conversation_id: input.conversationId,
    user_id: input.userId,
    branch_id: input.branchId,
    role: input.role,
    content: input.content,
    created_at: '2026-10-13T12:00:00Z',
    ...overrides,
  }
}

function makeClient(result: {
  data: SavedBranchMessage | null
  error: unknown
}) {
  let inserted: Record<string, unknown> | null = null

  const client = {
    from(table: string) {
      assert.equal(table, 'conversation_messages')

      return {
        insert(values: Record<string, unknown>) {
          inserted = values

          return {
            select(columns: string) {
              assert.match(columns, /branch_id/)
              assert.match(columns, /created_at/)

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
    client: client as BranchMessageInsertClient,
    getInserted: () => inserted,
  }
}

test('saves a revised user question to its branch', async () => {
  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  const result = await saveBranchMessage(mock.client, input)

  assert.equal(result.id, 'message-new')
  assert.deepEqual(mock.getInserted(), {
    conversation_id: 'conversation-1',
    user_id: 'user-1',
    branch_id: 'branch-1',
    role: 'user',
    content: 'What happens in the opening scene?',
  })
})

test('saves an assistant answer to the same branch', async () => {
  const assistantInput: SaveBranchMessageInput = {
    ...input,
    role: 'assistant',
    content: 'The recording opens with a city street.',
  }

  const mock = makeClient({
    data: validMessage({
      role: 'assistant',
      content: assistantInput.content,
    }),
    error: null,
  })

  const result = await saveBranchMessage(
    mock.client,
    assistantInput,
  )

  assert.equal(result.role, 'assistant')
  assert.equal(result.branch_id, 'branch-1')
})

test('rejects database insertion errors', async () => {
  const mock = makeClient({
    data: null,
    error: { message: 'Insert failed' },
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Branch message save failed/,
  )
})

test('rejects a missing saved record', async () => {
  const mock = makeClient({
    data: null,
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Branch message save failed/,
  )
})

test('rejects a message returned for another user', async () => {
  const mock = makeClient({
    data: validMessage({ user_id: 'another-user' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects a message returned for another conversation', async () => {
  const mock = makeClient({
    data: validMessage({
      conversation_id: 'another-conversation',
    }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects a message returned for another branch', async () => {
  const mock = makeClient({
    data: validMessage({ branch_id: 'another-branch' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects an incorrect returned role', async () => {
  const mock = makeClient({
    data: validMessage({ role: 'assistant' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects altered returned message content', async () => {
  const mock = makeClient({
    data: validMessage({ content: 'Unexpected content' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects a missing saved message ID', async () => {
  const mock = makeClient({
    data: validMessage({ id: '' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects a missing creation timestamp', async () => {
  const mock = makeClient({
    data: validMessage({ created_at: '' }),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(mock.client, input),
    /Saved branch message verification failed/,
  )
})

test('rejects empty message content before database access', async () => {
  let accessed = false

  const client = {
    from() {
      accessed = true
      throw new Error('Database must not be accessed')
    },
  }

  await assert.rejects(
    saveBranchMessage(
      client as BranchMessageInsertClient,
      { ...input, content: '   ' },
    ),
    /Invalid branch message input/,
  )

  assert.equal(accessed, false)
})

test('rejects an invalid role before database access', async () => {
  let accessed = false

  const client = {
    from() {
      accessed = true
      throw new Error('Database must not be accessed')
    },
  }

  await assert.rejects(
    saveBranchMessage(
      client as BranchMessageInsertClient,
      {
        ...input,
        role: 'system' as SaveBranchMessageInput['role'],
      },
    ),
    /Invalid branch message input/,
  )

  assert.equal(accessed, false)
})

test('rejects missing conversation identity', async () => {
  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(
      mock.client,
      { ...input, conversationId: ' ' },
    ),
    /Invalid branch message input/,
  )

  assert.equal(mock.getInserted(), null)
})

test('rejects missing user identity', async () => {
  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(
      mock.client,
      { ...input, userId: ' ' },
    ),
    /Invalid branch message input/,
  )

  assert.equal(mock.getInserted(), null)
})

test('rejects missing branch identity', async () => {
  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  await assert.rejects(
    saveBranchMessage(
      mock.client,
      { ...input, branchId: ' ' },
    ),
    /Invalid branch message input/,
  )

  assert.equal(mock.getInserted(), null)
})

test('does not mutate the original message input', async () => {
  const before = JSON.stringify(input)

  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  await saveBranchMessage(mock.client, input)

  assert.equal(JSON.stringify(input), before)
})


test('saves verified evidence with an assistant message', async () => {
  const evidence = [{
    id: 'chunk-1',
    type: 'transcript_chunk' as const,
    timestamp: 12,
    content: 'The speaker introduces the topic.',
  }]

  const assistantInput: SaveBranchMessageInput = {
    ...input,
    role: 'assistant',
    content: 'The speaker introduces the topic.',
    evidence,
  }

  const mock = makeClient({
    data: validMessage({
      role: 'assistant',
      content: assistantInput.content,
    }),
    error: null,
  })

  await saveBranchMessage(mock.client, assistantInput)

  assert.deepEqual(mock.getInserted(), {
    conversation_id: input.conversationId,
    user_id: input.userId,
    branch_id: input.branchId,
    role: 'assistant',
    content: assistantInput.content,
    evidence,
  })
})

test('does not add evidence to legacy branch messages', async () => {
  const mock = makeClient({
    data: validMessage(),
    error: null,
  })

  await saveBranchMessage(mock.client, input)

  assert.equal(
    Object.prototype.hasOwnProperty.call(
      mock.getInserted(),
      'evidence',
    ),
    false,
  )
})
