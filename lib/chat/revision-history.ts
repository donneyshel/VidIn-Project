import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

export type RevisionHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function buildRevisionHistory(
  messages: BranchMessage[],
  branches: ConversationBranch[],
  activeBranchId: string | null,
  editMessageId: string,
): RevisionHistoryMessage[] {
  if (!editMessageId.trim()) {
    throw new Error('An editable message ID is required.')
  }

  const history = reconstructBranchHistory(
    messages,
    branches,
    activeBranchId,
  )

  const editIndex = history.findIndex(
    (message) => message.id === editMessageId,
  )

  if (editIndex < 0 || history[editIndex].role !== 'user') {
    throw new Error(
      'The edited question is not in the active conversation path.',
    )
  }

  return history
    .slice(0, editIndex)
    .slice(-30)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}
