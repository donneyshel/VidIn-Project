import {
  createConversationBranch,
  type BranchInsertClient,
  type CreatedConversationBranch,
} from './create-conversation-branch'
import {
  saveBranchMessage,
  type BranchMessageInsertClient,
  type SavedBranchMessage,
} from './save-branch-message'
import type {
  PreparedConversationEdit,
} from './prepare-conversation-edit'

export type ConversationRevisionClient =
  BranchInsertClient &
  BranchMessageInsertClient & {
    deleteCreatedBranch(
      branchId: string,
      conversationId: string,
      userId: string,
    ): Promise<{ error: unknown }>
  }

export type CreatedConversationRevision = {
  branch: CreatedConversationBranch
  userMessage: SavedBranchMessage
}

export async function createConversationRevision(
  client: ConversationRevisionClient,
  prepared: PreparedConversationEdit,
): Promise<CreatedConversationRevision> {
  if (
    !prepared.conversation_id.trim() ||
    !prepared.user_id.trim() ||
    !prepared.fork_message_id.trim() ||
    !prepared.revised_question.trim()
  ) {
    throw new Error('Invalid conversation revision.')
  }

  const branch = await createConversationBranch(
    client,
    prepared,
  )

  let userMessage: SavedBranchMessage

  try {
    userMessage = await saveBranchMessage(client, {
      conversationId: prepared.conversation_id,
      userId: prepared.user_id,
      branchId: branch.id,
      role: 'user',
      content: prepared.revised_question,
    })
  } catch (saveError) {
    try {
      const { error: cleanupError } =
        await client.deleteCreatedBranch(
          branch.id,
          prepared.conversation_id,
          prepared.user_id,
        )

      if (cleanupError) {
        throw new Error('Branch cleanup was rejected.')
      }
    } catch {
      throw new Error(
        'Revised question could not be saved and branch cleanup failed.',
        { cause: saveError },
      )
    }

    throw new Error(
      'Revised question could not be saved. The new branch was cleaned up.',
      { cause: saveError },
    )
  }

  return {
    branch,
    userMessage,
  }
}
