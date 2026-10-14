import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRevisionHistory,
} from './revision-history'
import type {
  BranchMessage,
  ConversationBranch,
} from './branch-history'

const messages: BranchMessage[] = [
  {
    id: 'q1',
    branch_id: null,
    role: 'user',
    content: 'First question',
    created_at: '2026-10-13T10:00:00Z',
  },
  {
    id: 'a1',
    branch_id: null,
    role: 'assistant',
    content: 'First answer',
    created_at: '2026-10-13T10:01:00Z',
  },
  {
    id: 'q2',
    branch_id: null,
    role: 'user',
    content: 'Second question',
    created_at: '2026-10-13T10:02:00Z',
  },
  {
    id: 'a2',
    branch_id: null,
    role: 'assistant',
    content: 'Second answer',
    created_at: '2026-10-13T10:03:00Z',
  },
  {
    id: 'q3',
    branch_id: null,
    role: 'user',
    content: 'Third question',
    created_at: '2026-10-13T10:04:00Z',
  },
]

const branches: ConversationBranch[] = [
  {
    id: 'branch-1',
    parent_branch_id: null,
    fork_message_id: 'q2',
  },
  {
    id: 'branch-2',
    parent_branch_id: 'branch-1',
    fork_message_id: 'q2-edited',
  },
]

const branchMessages: BranchMessage[] = [
  ...messages,
  {
    id: 'q2-edited',
    branch_id: 'branch-1',
    role: 'user',
    content: 'Revised second question',
    created_at: '2026-10-13T11:00:00Z',
  },
  {
    id: 'a2-edited',
    branch_id: 'branch-1',
    role: 'assistant',
    content: 'Revised second answer',
    created_at: '2026-10-13T11:01:00Z',
  },
  {
    id: 'q2-revised-again',
    branch_id: 'branch-2',
    role: 'user',
    content: 'Second revision',
    created_at: '2026-10-13T12:00:00Z',
  },
]

test('editing first question has no previous history', () => {
  assert.deepEqual(
    buildRevisionHistory(messages, [], null, 'q1'),
    [],
  )
})

test('editing second question includes only first exchange', () => {
  assert.deepEqual(
    buildRevisionHistory(messages, [], null, 'q2'),
    [
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
    ],
  )
})

test('editing third question excludes its own message', () => {
  const history = buildRevisionHistory(messages, [], null, 'q3')

  assert.equal(history.length, 4)
  assert.equal(history.some(item => item.content === 'Third question'), false)
})

test('editing earlier question excludes later original answers', () => {
  const history = buildRevisionHistory(messages, [], null, 'q2')

  assert.equal(history.some(item => item.content === 'Second answer'), false)
  assert.equal(history.some(item => item.content === 'Third question'), false)
})

test('editing revised question uses inherited history', () => {
  assert.deepEqual(
    buildRevisionHistory(
      branchMessages,
      branches,
      'branch-1',
      'q2-edited',
    ),
    [
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
    ],
  )
})

test('nested revision excludes previous revised answer', () => {
  const history = buildRevisionHistory(
    branchMessages,
    branches,
    'branch-2',
    'q2-revised-again',
  )

  assert.equal(
    history.some(item => item.content === 'Revised second answer'),
    false,
  )
  assert.deepEqual(history, [
    { role: 'user', content: 'First question' },
    { role: 'assistant', content: 'First answer' },
  ])
})

test('rejects an assistant message as an edit target', () => {
  assert.throws(
    () => buildRevisionHistory(messages, [], null, 'a1'),
    /not in the active conversation path/,
  )
})

test('rejects a missing edit target', () => {
  assert.throws(
    () => buildRevisionHistory(messages, [], null, 'missing'),
    /not in the active conversation path/,
  )
})

test('rejects an empty edit target', () => {
  assert.throws(
    () => buildRevisionHistory(messages, [], null, ' '),
    /editable message ID is required/,
  )
})

test('rejects editing a question outside the active branch', () => {
  assert.throws(
    () => buildRevisionHistory(
      branchMessages,
      branches,
      'branch-1',
      'q3',
    ),
    /not in the active conversation path/,
  )
})

test('does not mutate original messages or branches', () => {
  const beforeMessages = JSON.stringify(branchMessages)
  const beforeBranches = JSON.stringify(branches)

  buildRevisionHistory(
    branchMessages,
    branches,
    'branch-2',
    'q2-revised-again',
  )

  assert.equal(JSON.stringify(branchMessages), beforeMessages)
  assert.equal(JSON.stringify(branches), beforeBranches)
})
