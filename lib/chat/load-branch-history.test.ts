import assert from 'node:assert/strict'
import test from 'node:test'
import {
  loadBranchHistory,
  type BranchHistorySource,
} from './load-branch-history'
import type {
  BranchMessage,
  ConversationBranch,
} from './branch-history'

const messages: BranchMessage[] = [
  { id: 'm1', role: 'user', content: 'First question', created_at: '2026-10-12T10:00:00Z', branch_id: null },
  { id: 'm2', role: 'assistant', content: 'First answer', created_at: '2026-10-12T10:01:00Z', branch_id: null },
  { id: 'm3', role: 'user', content: 'Original question', created_at: '2026-10-12T10:02:00Z', branch_id: null },
  { id: 'm4', role: 'assistant', content: 'Original answer', created_at: '2026-10-12T10:03:00Z', branch_id: null },
  { id: 'm5', role: 'user', content: 'Revised question', created_at: '2026-10-12T10:04:00Z', branch_id: 'b1' },
  { id: 'm6', role: 'assistant', content: 'Revised answer', created_at: '2026-10-12T10:05:00Z', branch_id: 'b1' },
  { id: 'm7', role: 'user', content: 'Nested revision', created_at: '2026-10-12T10:06:00Z', branch_id: 'b2' },
  { id: 'm8', role: 'assistant', content: 'Nested answer', created_at: '2026-10-12T10:07:00Z', branch_id: 'b2' },
]

const branches: ConversationBranch[] = [
  { id: 'b1', parent_branch_id: null, fork_message_id: 'm3' },
  { id: 'b2', parent_branch_id: 'b1', fork_message_id: 'm5' },
]

function source(
  items: BranchMessage[] = messages,
  paths: ConversationBranch[] = branches,
): BranchHistorySource {
  return {
    async loadMessages() {
      return items
    },
    async loadBranches() {
      return paths
    },
  }
}

const contents = (
  history: Awaited<ReturnType<typeof loadBranchHistory>>,
) => history.map((message) => message.content)

test('loads the original conversation without branch messages', async () => {
  const history = await loadBranchHistory(
    source(), 'conversation-1', 'user-1', null,
  )

  assert.deepEqual(contents(history), [
    'First question',
    'First answer',
    'Original question',
    'Original answer',
  ])
})

test('loads edited history without the original question', async () => {
  const history = await loadBranchHistory(
    source(), 'conversation-1', 'user-1', 'b1',
  )

  assert.deepEqual(contents(history), [
    'First question',
    'First answer',
    'Revised question',
    'Revised answer',
  ])
})

test('loads nested edit history correctly', async () => {
  const history = await loadBranchHistory(
    source(), 'conversation-1', 'user-1', 'b2',
  )

  assert.deepEqual(contents(history), [
    'First question',
    'First answer',
    'Nested revision',
    'Nested answer',
  ])
})

test('limits long histories to the latest 30 messages', async () => {
  const longMessages: BranchMessage[] = Array.from(
    { length: 50 },
    (_, index) => ({
      id: `long-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${index}`,
      created_at: new Date(
        Date.UTC(2026, 9, 12, 10, index),
      ).toISOString(),
      branch_id: null,
    }),
  )

  const history = await loadBranchHistory(
    source(longMessages, []),
    'conversation-1',
    'user-1',
    null,
  )

  assert.equal(history.length, 30)
  assert.equal(history[0].content, 'Message 20')
  assert.equal(history[29].content, 'Message 49')
})

test('rejects missing conversation identity', async () => {
  await assert.rejects(
    loadBranchHistory(source(), '', 'user-1', null),
    /Conversation and user IDs are required/,
  )
})

test('rejects missing user identity', async () => {
  await assert.rejects(
    loadBranchHistory(source(), 'conversation-1', '', null),
    /Conversation and user IDs are required/,
  )
})

test('propagates source loading failures', async () => {
  const failingSource: BranchHistorySource = {
    async loadMessages() {
      throw new Error('Message loading failed')
    },
    async loadBranches() {
      return []
    },
  }

  await assert.rejects(
    loadBranchHistory(
      failingSource,
      'conversation-1',
      'user-1',
      null,
    ),
    /Message loading failed/,
  )
})

test('rejects invalid branch history', async () => {
  await assert.rejects(
    loadBranchHistory(
      source(),
      'conversation-1',
      'user-1',
      'missing-branch',
    ),
    /Conversation branch not found/,
  )
})
