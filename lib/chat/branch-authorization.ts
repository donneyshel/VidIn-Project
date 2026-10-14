export type BranchAuthorizationContext = {
  userId: string
  conversationId: string
  recordingId: string
}

export type AuthorizedConversation = {
  id: string
  user_id: string
  recording_id: string
}

export type AuthorizedBranch = {
  id: string
  conversation_id: string
  user_id: string
}

export type AuthorizedMessage = {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
}

export function assertConversationOwnership(
  conversation: AuthorizedConversation | null,
  context: BranchAuthorizationContext,
): void {
  if (
    !conversation ||
    conversation.id !== context.conversationId ||
    conversation.user_id !== context.userId ||
    conversation.recording_id !== context.recordingId
  ) {
    throw new Error('Conversation ownership verification failed.')
  }
}

export function assertBranchOwnership(
  branch: AuthorizedBranch | null,
  context: BranchAuthorizationContext,
): void {
  if (
    !branch ||
    branch.conversation_id !== context.conversationId ||
    branch.user_id !== context.userId
  ) {
    throw new Error('Conversation branch ownership verification failed.')
  }
}

export function assertEditableMessageOwnership(
  message: AuthorizedMessage | null,
  context: BranchAuthorizationContext,
): void {
  if (
    !message ||
    message.conversation_id !== context.conversationId ||
    message.user_id !== context.userId ||
    message.role !== 'user'
  ) {
    throw new Error('Editable message ownership verification failed.')
  }
}
