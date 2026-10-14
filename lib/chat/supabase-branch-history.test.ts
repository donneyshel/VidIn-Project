import assert from 'node:assert/strict'
import test from 'node:test'
import { createSupabaseBranchHistorySource } from './supabase-branch-history'

type Row = Record<string, unknown>
type QueryLog = {
  table: string
  filters: Record<string, unknown>
  start: number
  end: number
  ordering: string[]
  columns: string
}

function mockSupabase(
  messages: Row[],
  branches: Row[],
  failingTable?: string,
) {
  const queries: QueryLog[] = []

  const client = {
    from(table: string) {
      const filters: Record<string, unknown> = {}
      const ordering: string[] = []
      let selectedColumns = ''

      const builder = {
        select(columns: string) {
          selectedColumns = columns
          return builder
        },
        eq(column: string, value: unknown) {
          filters[column] = value
          return builder
        },
        order(column: string, options: { ascending: boolean }) {
          ordering.push(`${column}:${options.ascending}`)
          return builder
        },
        async range(start: number, end: number) {
          queries.push({
            table,
            filters: { ...filters },
            start,
            end,
            ordering: [...ordering],
            columns: selectedColumns,
          })

          if (table === failingTable) {
            return {
              data: null,
              error: { message: 'Simulated database error' },
            }
          }

          const rows =
            table === 'conversation_messages'
              ? messages
              : branches

          return {
            data: rows
              .filter((row) =>
                Object.entries(filters).every(
                  ([key, value]) => row[key] === value,
                ),
              )
              .slice(start, end + 1),
            error: null,
          }
        },
      }

      return builder
    },
  }

  return { client, queries }
}

function message(index: number): Row {
  return {
    id: `message-${String(index).padStart(5, '0')}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${index}`,
    created_at: new Date(
      Date.UTC(2026, 9, 12, 0, 0, index),
    ).toISOString(),
    branch_id: null,
    conversation_id: 'conversation-1',
    user_id: 'user-1',
  }
}

test('loads 1205 messages across three pages', async () => {
  const mock = mockSupabase(
    Array.from({ length: 1205 }, (_, index) => message(index)),
    [],
  )

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  const result = await source.loadMessages(
    'conversation-1',
    'user-1',
  )

  assert.equal(result.length, 1205)
  assert.equal(result[0].content, 'Message 0')
  assert.equal(result[1204].content, 'Message 1204')

  const pages = mock.queries.filter(
    (query) => query.table === 'conversation_messages',
  )

  assert.deepEqual(
    pages.map(({ start, end }) => [start, end]),
    [[0, 499], [500, 999], [1000, 1499]],
  )
})

test('filters message queries by conversation and user', async () => {
  const mock = mockSupabase(
    [
      message(0),
      { ...message(1), user_id: 'another-user' },
      { ...message(2), conversation_id: 'another-conversation' },
    ],
    [],
  )

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  const result = await source.loadMessages(
    'conversation-1',
    'user-1',
  )

  assert.equal(result.length, 1)
  assert.equal(result[0].content, 'Message 0')

  assert.deepEqual(mock.queries[0].filters, {
    conversation_id: 'conversation-1',
    user_id: 'user-1',
  })

  assert.deepEqual(mock.queries[0].ordering, [
    'created_at:true',
    'id:true',
  ])
})

test('loads nested branch records', async () => {
  const mock = mockSupabase([], [
    {
      id: 'branch-1',
      parent_branch_id: null,
      fork_message_id: 'message-1',
      conversation_id: 'conversation-1',
      user_id: 'user-1',
    },
    {
      id: 'branch-2',
      parent_branch_id: 'branch-1',
      fork_message_id: 'message-2',
      conversation_id: 'conversation-1',
      user_id: 'user-1',
    },
  ])

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  const result = await source.loadBranches(
    'conversation-1',
    'user-1',
  )

  assert.equal(result.length, 2)
  assert.equal(result[1].parent_branch_id, 'branch-1')

  assert.deepEqual(mock.queries[0].filters, {
    conversation_id: 'conversation-1',
    user_id: 'user-1',
  })
})

test('rejects message database errors', async () => {
  const mock = mockSupabase(
    [],
    [],
    'conversation_messages',
  )

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  await assert.rejects(
    source.loadMessages('conversation-1', 'user-1'),
    /Failed to load branch conversation messages/,
  )
})

test('rejects branch database errors', async () => {
  const mock = mockSupabase(
    [],
    [],
    'conversation_branches',
  )

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  await assert.rejects(
    source.loadBranches('conversation-1', 'user-1'),
    /Failed to load conversation branches/,
  )
})

test('does not return another user’s branch records', async () => {
  const mock = mockSupabase([], [
    {
      id: 'authorized',
      parent_branch_id: null,
      fork_message_id: 'message-1',
      conversation_id: 'conversation-1',
      user_id: 'user-1',
    },
    {
      id: 'unauthorized',
      parent_branch_id: null,
      fork_message_id: 'message-2',
      conversation_id: 'conversation-1',
      user_id: 'another-user',
    },
  ])

  const source = createSupabaseBranchHistorySource(
    mock.client as never,
  )

  const result = await source.loadBranches(
    'conversation-1',
    'user-1',
  )

  assert.deepEqual(
    result.map((branch) => branch.id),
    ['authorized'],
  )
})

test('preserves evidence when the evidence flag is enabled', async () => {
  const previous = process.env.VIDIN_CHAT_EVIDENCE_ENABLED

  try {
    process.env.VIDIN_CHAT_EVIDENCE_ENABLED = 'true'

    const evidence = [{
      id: 'chunk-1',
      type: 'transcript_chunk',
      content: 'The speaker introduces the topic.',
    }]

    const mock = mockSupabase(
      [{
        id: 'assistant-1',
        role: 'assistant',
        content: 'The topic is introduced.',
        created_at: '2026-10-14T10:00:00Z',
        branch_id: null,
        conversation_id: 'conversation-1',
        user_id: 'user-1',
        evidence,
      }],
      [],
    )

    const source = createSupabaseBranchHistorySource(
      mock.client as never,
    )

    const messages = await source.loadMessages(
      'conversation-1',
      'user-1',
    )

    assert.equal(messages.length, 1)
    assert.deepEqual(messages[0].evidence, evidence)
    assert.equal(
      mock.queries[0].columns,
      'id,role,content,created_at,branch_id,evidence',
    )
  } finally {
    if (previous === undefined) {
      delete process.env.VIDIN_CHAT_EVIDENCE_ENABLED
    } else {
      process.env.VIDIN_CHAT_EVIDENCE_ENABLED = previous
    }
  }
})

test('uses legacy columns when evidence storage is disabled', async () => {
  const previous = process.env.VIDIN_CHAT_EVIDENCE_ENABLED

  try {
    delete process.env.VIDIN_CHAT_EVIDENCE_ENABLED

    const mock = mockSupabase([message(0)], [])

    const source = createSupabaseBranchHistorySource(
      mock.client as never,
    )

    await source.loadMessages('conversation-1', 'user-1')

    assert.equal(
      mock.queries[0].columns,
      'id,role,content,created_at,branch_id',
    )
  } finally {
    if (previous === undefined) {
      delete process.env.VIDIN_CHAT_EVIDENCE_ENABLED
    } else {
      process.env.VIDIN_CHAT_EVIDENCE_ENABLED = previous
    }
  }
})
