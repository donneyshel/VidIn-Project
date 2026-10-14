import assert from 'node:assert/strict'
import test from 'node:test'
import { restoreMessageEvidence } from './restore-message-evidence'
import { reconstructBranchHistory } from './branch-history'

test('restores evidence for assistant messages', () => {
  const evidence = [{
    id: 'chunk-1',
    type: 'transcript_chunk',
    timestamp: 15,
    content: 'A speaker begins talking.',
  }]

  assert.deepEqual(
    restoreMessageEvidence([
      { id: 'assistant-1', role: 'assistant', evidence },
    ]),
    { 'assistant-1': evidence },
  )
})

test('restores evidence without a timestamp', () => {
  const evidence = [{
    id: 'visual-1',
    type: 'visual_event',
    content: 'A city street appears.',
  }]

  assert.deepEqual(
    restoreMessageEvidence([
      { id: 'assistant-2', role: 'assistant', evidence },
    ]),
    { 'assistant-2': evidence },
  )
})

test('ignores malformed evidence and user-message evidence', () => {
  assert.deepEqual(
    restoreMessageEvidence([
      {
        id: 'user-1',
        role: 'user',
        evidence: [{
          id: 'chunk-1',
          type: 'transcript_chunk',
          content: 'Not assistant evidence',
        }],
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        evidence: [{
          id: 'invalid',
          type: 'unknown',
          content: 'Invalid evidence type',
        }],
      },
    ]),
    {},
  )
})

test('branch reconstruction preserves assistant evidence', () => {
  const evidence = [{
    id: 'chunk-1',
    type: 'transcript_chunk',
    content: 'The original scene.',
  }]

  const messages = [
    {
      id: 'user-1',
      role: 'user' as const,
      content: 'Describe the scene.',
      created_at: '2026-10-14T10:00:00Z',
      branch_id: null,
    },
    {
      id: 'assistant-1',
      role: 'assistant' as const,
      content: 'The scene opens outdoors.',
      created_at: '2026-10-14T10:01:00Z',
      branch_id: null,
      evidence,
    },
  ]

  const result = reconstructBranchHistory(messages, [], null)

  assert.deepEqual(
    restoreMessageEvidence(result),
    { 'assistant-1': evidence },
  )
})
