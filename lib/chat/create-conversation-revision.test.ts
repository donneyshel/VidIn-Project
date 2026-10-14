import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createConversationRevision,
  type ConversationRevisionClient,
} from './create-conversation-revision'
import type { PreparedConversationEdit } from './prepare-conversation-edit'

const prepared: PreparedConversationEdit = {
  conversation_id: 'conversation-1',
  user_id: 'user-1',
  parent_branch_id: null,
  fork_message_id: 'original-question',
  revised_question: 'What does the video show?',
}

type Scenario = {
  branchError?: unknown
  messageError?: unknown
  cleanupError?: unknown
  cleanupThrows?: boolean
}

function createMock(scenario: Scenario = {}) {
  const calls: string[] = []
  const cleanupIdentities: string[][] = []

  const branch = {
    id: 'new-branch',
    conversation_id: prepared.conversation_id,
    user_id: prepared.user_id,
    parent_branch_id: prepared.parent_branch_id,
    fork_message_id: prepared.fork_message_id,
  }

  const message = {
    id: 'new-question',
    conversation_id: prepared.conversation_id,
    user_id: prepared.user_id,
    branch_id: branch.id,
    role: 'user' as const,
    content: prepared.revised_question,
    created_at: '2026-10-13T12:00:00.000Z',
  }

  const client = {
    from(table: string) {
      if (table === 'conversation_branches') {
        return {
          insert(values: unknown) {
            calls.push('create-branch')
            assert.deepEqual(values, {
              conversation_id: prepared.conversation_id,
              user_id: prepared.user_id,
              parent_branch_id: prepared.parent_branch_id,
              fork_message_id: prepared.fork_message_id,
            })

            return {
              select() {
                return {
                  async single() {
                    return {
                      data: scenario.branchError ? null : branch,
                      error: scenario.branchError ?? null,
                    }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'conversation_messages') {
        return {
          insert(values: unknown) {
            calls.push('save-question')
            assert.deepEqual(values, {
              conversation_id: prepared.conversation_id,
              user_id: prepared.user_id,
              branch_id: branch.id,
              role: 'user',
              content: prepared.revised_question,
            })

            return {
              select() {
                return {
                  async single() {
                    return {
                      data: scenario.messageError ? null : message,
                      error: scenario.messageError ?? null,
                    }
                  },
                }
              },
            }
          },
        }
      }

      throw new Error('Unexpected database table')
    },

    async deleteCreatedBranch(
      branchId: string,
      conversationId: string,
      userId: string,
    ) {
      calls.push('cleanup-branch')
      cleanupIdentities.push([branchId, conversationId, userId])

      if (scenario.cleanupThrows) {
        throw new Error('Cleanup verification failed')
      }

      return { error: scenario.cleanupError ?? null }
    },
  } as unknown as ConversationRevisionClient

  return { client, calls, cleanupIdentities }
}

test('creates a branch and saves its revised question', async () => {
  const mock = createMock()

  const result = await createConversationRevision(mock.client, prepared)

  assert.equal(result.branch.id, 'new-branch')
  assert.equal(result.userMessage.id, 'new-question')
  assert.deepEqual(mock.calls, ['create-branch', 'save-question'])
})

test('does not attempt cleanup when revision succeeds', async () => {
  const mock = createMock()

  await createConversationRevision(mock.client, prepared)

  assert.equal(mock.calls.includes('cleanup-branch'), false)
})

test('does not save a message when branch creation fails', async () => {
  const mock = createMock({
    branchError: { message: 'Branch insertion rejected' },
  })

  await assert.rejects(
    createConversationRevision(mock.client, prepared),
  )

  assert.deepEqual(mock.calls, ['create-branch'])
})

test('cleans up the new branch when question saving fails', async () => {
  const mock = createMock({
    messageError: { message: 'Message insertion rejected' },
  })

  await assert.rejects(
    createConversationRevision(mock.client, prepared),
    /new branch was cleaned up/,
  )

  assert.deepEqual(mock.calls, [
    'create-branch',
    'save-question',
    'cleanup-branch',
  ])

  assert.deepEqual(mock.cleanupIdentities, [
    ['new-branch', 'conversation-1', 'user-1'],
  ])
})

test('reports an error when cleanup is rejected', async () => {
  const mock = createMock({
    messageError: { message: 'Message insertion rejected' },
    cleanupError: { message: 'Delete rejected' },
  })

  await assert.rejects(
    createConversationRevision(mock.client, prepared),
    /branch cleanup failed/,
  )
})

test('reports an error when cleanup verification throws', async () => {
  const mock = createMock({
    messageError: { message: 'Message insertion rejected' },
    cleanupThrows: true,
  })

  await assert.rejects(
    createConversationRevision(mock.client, prepared),
    /branch cleanup failed/,
  )
})

test('rejects an empty revised question before database access', async () => {
  const mock = createMock()

  await assert.rejects(
    createConversationRevision(mock.client, {
      ...prepared,
      revised_question: '   ',
    }),
    /Invalid conversation revision/,
  )

  assert.deepEqual(mock.calls, [])
})

test('rejects an empty conversation ID before database access', async () => {
  const mock = createMock()

  await assert.rejects(
    createConversationRevision(mock.client, {
      ...prepared,
      conversation_id: '',
    }),
    /Invalid conversation revision/,
  )

  assert.deepEqual(mock.calls, [])
})

test('rejects an empty user ID before database access', async () => {
  const mock = createMock()

  await assert.rejects(
    createConversationRevision(mock.client, {
      ...prepared,
      user_id: '',
    }),
    /Invalid conversation revision/,
  )

  assert.deepEqual(mock.calls, [])
})

test('rejects an empty fork message ID before database access', async () => {
  const mock = createMock()

  await assert.rejects(
    createConversationRevision(mock.client, {
      ...prepared,
      fork_message_id: '',
    }),
    /Invalid conversation revision/,
  )

  assert.deepEqual(mock.calls, [])
})

test('does not mutate the prepared revision input', async () => {
  const mock = createMock()
  const before = JSON.stringify(prepared)

  await createConversationRevision(mock.client, prepared)

  assert.equal(JSON.stringify(prepared), before)
})
