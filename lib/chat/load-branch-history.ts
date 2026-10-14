import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

export type BranchHistorySource = {
  loadMessages(
    conversationId: string,
    userId: string,
  ): Promise<BranchMessage[]>

  loadBranches(
    conversationId: string,
    userId: string,
  ): Promise<ConversationBranch[]>
}

export type ChatHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function loadBranchHistory(
  source: BranchHistorySource,
  conversationId: string,
  userId: string,
  activeBranchId: string | null,
): Promise<ChatHistoryMessage[]> {
  if (!conversationId.trim() || !userId.trim()) {
    throw new Error('Conversation and user IDs are required.')
  }

  const [messages, branches] = await Promise.all([
    source.loadMessages(conversationId, userId),
    source.loadBranches(conversationId, userId),
  ])

  const selectedHistory = reconstructBranchHistory(
    messages,
    branches,
    activeBranchId,
  )

  return selectedHistory
    .slice(-30)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}
