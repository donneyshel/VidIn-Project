import {
  assertEditableMessageOwnership,
  type AuthorizedMessage,
  type BranchAuthorizationContext,
} from './branch-authorization'
import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

export type PreparedConversationEdit = {
  parent_branch_id: string | null
  fork_message_id: string
  conversation_id: string
  user_id: string
  revised_question: string
}

export function prepareConversationEdit(
  messages: BranchMessage[],
  branches: ConversationBranch[],
  activeBranchId: string | null,
  editMessageId: string,
  revisedQuestion: string,
  context: BranchAuthorizationContext,
  editableMessage: AuthorizedMessage | null,
): PreparedConversationEdit {
  const question = revisedQuestion.trim()

  if (!question) {
    throw new Error('A revised question is required.')
  }

  if (!editMessageId.trim()) {
    throw new Error('An editable message ID is required.')
  }

  assertEditableMessageOwnership(editableMessage, context)

  if (editableMessage?.id !== editMessageId) {
    throw new Error('Editable message identity mismatch.')
  }

  const history = reconstructBranchHistory(
    messages,
    branches,
    activeBranchId,
  )

  const forkMessage = history.find(
    (message) => message.id === editMessageId,
  )

  if (!forkMessage || forkMessage.role !== 'user') {
    throw new Error(
      'The selected question is not in the active conversation path.',
    )
  }

  // A message may be inherited from an earlier branch.
  // Its owning branch is the correct parent for the new edit.
  const parentBranchId = forkMessage.branch_id

  return {
    parent_branch_id: parentBranchId,
    fork_message_id: editMessageId,
    conversation_id: context.conversationId,
    user_id: context.userId,
    revised_question: question,
  }
}
