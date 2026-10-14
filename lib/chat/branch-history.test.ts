import assert from 'node:assert/strict'
import test from 'node:test'
import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

const messages: BranchMessage[] = [
  { id: 'm1', role: 'user', content: 'First question', created_at: '2026-10-12T10:00:00Z', branch_id: null },
  { id: 'm2', role: 'assistant', content: 'First answer', created_at: '2026-10-12T10:01:00Z', branch_id: null },
  { id: 'm3', role: 'user', content: 'Original second question', created_at: '2026-10-12T10:02:00Z', branch_id: null },
  { id: 'm4', role: 'assistant', content: 'Original second answer', created_at: '2026-10-12T10:03:00Z', branch_id: null },
  { id: 'm5', role: 'user', content: 'Revised second question', created_at: '2026-10-12T10:04:00Z', branch_id: 'b1' },
  { id: 'm6', role: 'assistant', content: 'Revised second answer', created_at: '2026-10-12T10:05:00Z', branch_id: 'b1' },
  { id: 'm7', role: 'user', content: 'Nested revision', created_at: '2026-10-12T10:06:00Z', branch_id: 'b2' },
  { id: 'm8', role: 'assistant', content: 'Nested answer', created_at: '2026-10-12T10:07:00Z', branch_id: 'b2' },
]

const branches: ConversationBranch[] = [
  { id: 'b1', parent_branch_id: null, fork_message_id: 'm3' },
  { id: 'b2', parent_branch_id: 'b1', fork_message_id: 'm5' },
]

const ids = (items: BranchMessage[]) => items.map((message) => message.id)

test('original history excludes branched messages', () => {
  assert.deepEqual(
    ids(reconstructBranchHistory(messages, branches, null)),
    ['m1', 'm2', 'm3', 'm4'],
  )
})

test('edited question excludes original question and later answers', () => {
  assert.deepEqual(
    ids(reconstructBranchHistory(messages, branches, 'b1')),
    ['m1', 'm2', 'm5', 'm6'],
  )
})

test('nested revision inherits only the correct preceding history', () => {
  assert.deepEqual(
    ids(reconstructBranchHistory(messages, branches, 'b2')),
    ['m1', 'm2', 'm7', 'm8'],
  )
})

test('missing fork message is rejected', () => {
  const invalid = [
    { id: 'broken', parent_branch_id: null, fork_message_id: 'missing' },
  ]

  assert.throws(
    () => reconstructBranchHistory(messages, invalid, 'broken'),
    /fork point not found/,
  )
})

test('missing branch is rejected', () => {
  assert.throws(
    () => reconstructBranchHistory(messages, branches, 'missing'),
    /branch not found/,
  )
})

test('circular branch relationships are rejected', () => {
  const circular = [
    { id: 'a', parent_branch_id: 'b', fork_message_id: 'm1' },
    { id: 'b', parent_branch_id: 'a', fork_message_id: 'm1' },
  ]

  assert.throws(
    () => reconstructBranchHistory(messages, circular, 'a'),
    /cycle detected/,
  )
})

test('reconstruction does not mutate original messages', () => {
  const before = JSON.stringify(messages)

  reconstructBranchHistory(messages, branches, 'b1')

  assert.equal(JSON.stringify(messages), before)
})


test('forking from an assistant answer is rejected', () => {
  const invalid: ConversationBranch[] = [
    { id: 'invalid', parent_branch_id: null, fork_message_id: 'm2' },
  ]

  assert.throws(
    () => reconstructBranchHistory(messages, invalid, 'invalid'),
    /must fork from a user question/,
  )
})

test('duplicate message IDs are rejected', () => {
  assert.throws(
    () => reconstructBranchHistory([...messages, messages[0]], branches, null),
    /Duplicate conversation message ID/,
  )
})

test('duplicate branch IDs are rejected', () => {
  assert.throws(
    () => reconstructBranchHistory(messages, [...branches, branches[0]], 'b1'),
    /Duplicate conversation branch ID/,
  )
})
