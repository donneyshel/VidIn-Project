import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertConversationOwnership,
  assertBranchOwnership,
  assertEditableMessageOwnership,
  type BranchAuthorizationContext,
} from './branch-authorization'

const context: BranchAuthorizationContext = {
  userId: 'user-1',
  conversationId: 'conversation-1',
  recordingId: 'recording-1',
}

const conversation = {
  id: 'conversation-1',
  user_id: 'user-1',
  recording_id: 'recording-1',
}

const branch = {
  id: 'branch-1',
  conversation_id: 'conversation-1',
  user_id: 'user-1',
}

const message = {
  id: 'message-1',
  conversation_id: 'conversation-1',
  user_id: 'user-1',
  role: 'user' as const,
}

test('valid conversation ownership passes', () => {
  assert.doesNotThrow(() =>
    assertConversationOwnership(conversation, context),
  )
})

test('another user cannot access the conversation', () => {
  assert.throws(
    () => assertConversationOwnership(
      { ...conversation, user_id: 'user-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('wrong recording is rejected', () => {
  assert.throws(
    () => assertConversationOwnership(
      { ...conversation, recording_id: 'recording-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('missing conversation is rejected', () => {
  assert.throws(
    () => assertConversationOwnership(null, context),
    /ownership verification failed/,
  )
})

test('valid branch ownership passes', () => {
  assert.doesNotThrow(() =>
    assertBranchOwnership(branch, context),
  )
})

test('another user cannot access the branch', () => {
  assert.throws(
    () => assertBranchOwnership(
      { ...branch, user_id: 'user-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('branch from another conversation is rejected', () => {
  assert.throws(
    () => assertBranchOwnership(
      { ...branch, conversation_id: 'conversation-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('missing branch is rejected', () => {
  assert.throws(
    () => assertBranchOwnership(null, context),
    /ownership verification failed/,
  )
})

test('valid user question can be edited', () => {
  assert.doesNotThrow(() =>
    assertEditableMessageOwnership(message, context),
  )
})

test('assistant response cannot be edited as a user question', () => {
  assert.throws(
    () => assertEditableMessageOwnership(
      { ...message, role: 'assistant' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('another user cannot edit a message', () => {
  assert.throws(
    () => assertEditableMessageOwnership(
      { ...message, user_id: 'user-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('message from another conversation cannot be edited', () => {
  assert.throws(
    () => assertEditableMessageOwnership(
      { ...message, conversation_id: 'conversation-2' },
      context,
    ),
    /ownership verification failed/,
  )
})

test('missing editable message is rejected', () => {
  assert.throws(
    () => assertEditableMessageOwnership(null, context),
    /ownership verification failed/,
  )
})
