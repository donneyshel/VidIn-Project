export type BranchMessageRole = 'user' | 'assistant'

export type BranchMessageEvidence = {
  id: string
  type: 'transcript_chunk' | 'visual_event'
  timestamp?: number
  content: string
}


export type SavedBranchMessage = {
  id: string
  conversation_id: string
  user_id: string
  branch_id: string
  role: BranchMessageRole
  content: string
  created_at: string
}

export type BranchMessageInsertResult = {
  data: SavedBranchMessage | null
  error: unknown
}

export type BranchMessageInsertClient = {
  from(table: 'conversation_messages'): {
    insert(values: {
      conversation_id: string
      user_id: string
      branch_id: string
      role: BranchMessageRole
      content: string
      evidence?: BranchMessageEvidence[]
    }): {
      select(columns: string): {
        single(): PromiseLike<BranchMessageInsertResult>
      }
    }
  }
}

export type SaveBranchMessageInput = {
  conversationId: string
  userId: string
  branchId: string
  role: BranchMessageRole
  content: string
  evidence?: BranchMessageEvidence[]
}

export async function saveBranchMessage(
  client: BranchMessageInsertClient,
  input: SaveBranchMessageInput,
): Promise<SavedBranchMessage> {
  const conversationId = input.conversationId.trim()
  const userId = input.userId.trim()
  const branchId = input.branchId.trim()
  const content = input.content.trim()

  if (
    !conversationId ||
    !userId ||
    !branchId ||
    !content ||
    (input.role !== 'user' && input.role !== 'assistant')
  ) {
    throw new Error('Invalid branch message input.')
  }

  const { data, error } = await client
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      branch_id: branchId,
      role: input.role,
      content,
      ...(input.evidence !== undefined
        ? { evidence: input.evidence }
        : {}),
    })
    .select(
      'id,conversation_id,user_id,branch_id,role,content,created_at',
    )
    .single()

  if (error || !data) {
    throw new Error('Branch message save failed.')
  }

  if (
    !data.id ||
    !data.created_at ||
    data.conversation_id !== conversationId ||
    data.user_id !== userId ||
    data.branch_id !== branchId ||
    data.role !== input.role ||
    data.content !== content
  ) {
    throw new Error('Saved branch message verification failed.')
  }

  return data
}
