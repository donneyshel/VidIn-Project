import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareConversationEdit } from './prepare-conversation-edit'
import type {
  BranchMessage,
  ConversationBranch,
} from './branch-history'

const context = {
  userId: 'user-1',
  conversationId: 'conversation-1',
  recordingId: 'recording-1',
}

const messages: BranchMessage[] = [
  { id: 'm1', role: 'user', content: 'Original question', created_at: '2026-10-12T10:00:00Z', branch_id: null },
  { id: 'm2', role: 'assistant', content: 'Original answer', created_at: '2026-10-12T10:01:00Z', branch_id: null },
  { id: 'm3', role: 'user', content: 'Second question', created_at: '2026-10-12T10:02:00Z', branch_id: null },
  { id: 'm4', role: 'assistant', content: 'Second answer', created_at: '2026-10-12T10:03:00Z', branch_id: null },
  { id: 'm5', role: 'user', content: 'Revised question', created_at: '2026-10-12T10:04:00Z', branch_id: 'b1' },
  { id: 'm6', role: 'assistant', content: 'Revised answer', created_at: '2026-10-12T10:05:00Z', branch_id: 'b1' },
  { id: 'm7', role: 'user', content: 'Nested question', created_at: '2026-10-12T10:06:00Z', branch_id: 'b2' },
]

const branches: ConversationBranch[] = [
  { id: 'b1', parent_branch_id: null, fork_message_id: 'm3' },
  { id: 'b2', parent_branch_id: 'b1', fork_message_id: 'm5' },
]

function editable(id: string, overrides = {}) {
  return {
    id,
    conversation_id: context.conversationId,
    user_id: context.userId,
    role: 'user' as const,
    ...overrides,
  }
}

test('editing an original question creates a root-level branch', () => {
  const result = prepareConversationEdit(
    messages, branches, null, 'm3',
    'Updated second question', context, editable('m3'),
  )

  assert.equal(result.parent_branch_id, null)
  assert.equal(result.fork_message_id, 'm3')
  assert.equal(result.revised_question, 'Updated second question')
  assert.equal(result.conversation_id, context.conversationId)
  assert.equal(result.user_id, context.userId)
})

test('editing a question inside a branch uses its owning branch', () => {
  const result = prepareConversationEdit(
    messages, branches, 'b1', 'm5',
    'Another revision', context, editable('m5'),
  )

  assert.equal(result.parent_branch_id, 'b1')
  assert.equal(result.fork_message_id, 'm5')
})

test('editing an inherited question forks from its original branch', () => {
  const result = prepareConversationEdit(
    messages, branches, 'b2', 'm1',
    'Change the first question', context, editable('m1'),
  )

  assert.equal(result.parent_branch_id, null)
  assert.equal(result.fork_message_id, 'm1')
})

test('editing a nested question uses the nested branch', () => {
  const result = prepareConversationEdit(
    messages, branches, 'b2', 'm7',
    'Update nested question', context, editable('m7'),
  )

  assert.equal(result.parent_branch_id, 'b2')
  assert.equal(result.fork_message_id, 'm7')
})

test('rejects editing a question outside the active path', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, 'b1', 'm7',
      'Invalid edit', context, editable('m7'),
    ),
    /not in the active conversation path/,
  )
})

test('rejects editing an assistant answer', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, null, 'm2',
      'Invalid edit', context,
      editable('m2', { role: 'assistant' }),
    ),
    /Editable message ownership verification failed/,
  )
})

test('rejects another user editing the message', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, null, 'm1',
      'Invalid edit', context,
      editable('m1', { user_id: 'another-user' }),
    ),
    /Editable message ownership verification failed/,
  )
})

test('rejects editing a message from another conversation', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, null, 'm1',
      'Invalid edit', context,
      editable('m1', { conversation_id: 'another-conversation' }),
    ),
    /Editable message ownership verification failed/,
  )
})

test('rejects a mismatched edited-message ID', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, null, 'm1',
      'Invalid edit', context, editable('m3'),
    ),
    /Editable message identity mismatch/,
  )
})

test('rejects an empty revised question', () => {
  assert.throws(
    () => prepareConversationEdit(
      messages, branches, null, 'm1',
      '   ', context, editable('m1'),
    ),
    /A revised question is required/,
  )
})

test('does not mutate existing messages or branches', () => {
  const beforeMessages = JSON.stringify(messages)
  const beforeBranches = JSON.stringify(branches)

  prepareConversationEdit(
    messages, branches, 'b2', 'm7',
    'Another question', context, editable('m7'),
  )

  assert.equal(JSON.stringify(messages), beforeMessages)
  assert.equal(JSON.stringify(branches), beforeBranches)
})
