export type DeletedBranch = {
  id: string
  conversation_id: string
  user_id: string
}

export type BranchDeleteResult = {
  data: DeletedBranch | null
  error: unknown
}

export type BranchDeleteClient = {
  from(table: 'conversation_branches'): {
    delete(): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          eq(column: string, value: string): {
            select(columns: string): {
              maybeSingle(): PromiseLike<BranchDeleteResult>
            }
          }
        }
      }
    }
  }
}

export async function deleteCreatedBranch(
  client: BranchDeleteClient,
  branchId: string,
  conversationId: string,
  userId: string,
): Promise<{ error: null }> {
  const safeBranchId = branchId.trim()
  const safeConversationId = conversationId.trim()
  const safeUserId = userId.trim()

  if (!safeBranchId || !safeConversationId || !safeUserId) {
    throw new Error('Invalid branch cleanup identity.')
  }

  const { data, error } = await client
    .from('conversation_branches')
    .delete()
    .eq('id', safeBranchId)
    .eq('conversation_id', safeConversationId)
    .eq('user_id', safeUserId)
    .select('id,conversation_id,user_id')
    .maybeSingle()

  if (error) {
    throw new Error('Conversation branch cleanup failed.')
  }

  if (!data) {
    throw new Error(
      'Conversation branch cleanup failed: no branch was deleted.',
    )
  }

  if (
    data.id !== safeBranchId ||
    data.conversation_id !== safeConversationId ||
    data.user_id !== safeUserId
  ) {
    throw new Error(
      'Conversation branch cleanup identity verification failed.',
    )
  }

  return { error: null }
}
