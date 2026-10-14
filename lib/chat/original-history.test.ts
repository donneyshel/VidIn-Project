import assert from 'node:assert/strict'
import test from 'node:test'

import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

test('477: original conversation excludes all branch messages', () => {
  const messages: BranchMessage[] = [
    {
      id: 'original-question',
      role: 'user',
      content: 'Original question',
      created_at: '2026-10-01T00:00:00Z',
      branch_id: null,
    },
    {
      id: 'original-answer',
      role: 'assistant',
      content: 'Original answer',
      created_at: '2026-10-01T00:00:01Z',
      branch_id: null,
    },
    {
      id: 'edited-question',
      role: 'user',
      content: 'Edited question',
      created_at: '2026-10-01T00:00:02Z',
      branch_id: 'branch-one',
    },
    {
      id: 'edited-answer',
      role: 'assistant',
      content: 'Edited answer',
      created_at: '2026-10-01T00:00:03Z',
      branch_id: 'branch-one',
    },
  ]

  const branches: ConversationBranch[] = [
    {
      id: 'branch-one',
      parent_branch_id: null,
      fork_message_id: 'original-question',
    },
  ]

  const original = reconstructBranchHistory(messages, branches, null)

  assert.deepEqual(
    original.map((message) => message.id),
    ['original-question', 'original-answer'],
  )

  const edited = reconstructBranchHistory(
    messages,
    branches,
    'branch-one',
  )

  assert.deepEqual(
    edited.map((message) => message.id),
    ['edited-question', 'edited-answer'],
  )
})
