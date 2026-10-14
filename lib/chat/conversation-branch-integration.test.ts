import assert from 'node:assert/strict'
import test from 'node:test'

import {
  classifyChatOperation,
  selectChatBranchHistory,
  buildBranchResponse,
  buildEditRequest,
  buildBranchOptions,
} from './conversation-branch-integration'

const messages = [
  {
    id: 'q1',
    role: 'user' as const,
    content: 'Original question',
    created_at: '2026-01-01T00:00:00Z',
    branch_id: null,
  },
  {
    id: 'a1',
    role: 'assistant' as const,
    content: 'Original answer',
    created_at: '2026-01-01T00:00:01Z',
    branch_id: null,
  },
  {
    id: 'q2',
    role: 'user' as const,
    content: 'Revised question',
    created_at: '2026-01-01T00:00:02Z',
    branch_id: 'branch-1',
  },
  {
    id: 'a2',
    role: 'assistant' as const,
    content: 'Revised answer',
    created_at: '2026-01-01T00:00:03Z',
    branch_id: 'branch-1',
  },
]

const branches = [
  {
    id: 'branch-1',
    parent_branch_id: null,
    fork_message_id: 'q1',
  },
]

test('442: original history excludes revisions', () => {
  assert.deepEqual(
    selectChatBranchHistory(messages, branches, null),
    [
      { role: 'user', content: 'Original question' },
      { role: 'assistant', content: 'Original answer' },
    ],
  )
})

test('442: edited history excludes replaced question', () => {
  assert.deepEqual(
    selectChatBranchHistory(messages, branches, 'branch-1'),
    [
      { role: 'user', content: 'Revised question' },
      { role: 'assistant', content: 'Revised answer' },
    ],
  )
})

test('443: branch follow-up is classified correctly', () => {
  assert.deepEqual(
    classifyChatOperation('branch-1', null),
    { kind: 'branch-reply', branchId: 'branch-1' },
  )
})

test('443: editing takes precedence over branch reply', () => {
  assert.deepEqual(
    classifyChatOperation('branch-1', 'q2'),
    {
      kind: 'edit',
      editMessageId: 'q2',
      branchId: 'branch-1',
    },
  )
})

test('444: API response retains branch identity', () => {
  assert.deepEqual(
    buildBranchResponse({ answer: 'Done' }, 'branch-1'),
    { answer: 'Done', branchId: 'branch-1' },
  )
})

test('445: edit request includes original message identity', () => {
  assert.deepEqual(
    buildEditRequest('recording-1', 'Updated', 'q1', null),
    {
      recordingId: 'recording-1',
      question: 'Updated',
      editMessageId: 'q1',
    },
  )
})

test('445: empty edited questions are rejected', () => {
  assert.throws(() =>
    buildEditRequest('recording-1', ' ', 'q1', null),
  )
})

test('446: switching options preserve original conversation', () => {
  assert.deepEqual(buildBranchOptions(branches), [
    { id: null, label: 'Original conversation' },
    { id: 'branch-1', label: 'Version 1' },
  ])
})

test('446: duplicate branch identities are rejected', () => {
  assert.throws(() =>
    buildBranchOptions([...branches, ...branches]),
  )
})
