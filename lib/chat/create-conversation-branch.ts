import type {
  PreparedConversationEdit,
} from './prepare-conversation-edit'

export type CreatedConversationBranch = {
  id: string
  conversation_id: string
  user_id: string
  parent_branch_id: string | null
  fork_message_id: string
}

export type BranchInsertResult = {
  data: CreatedConversationBranch | null
  error: unknown
}

export type BranchInsertClient = {
  from(table: 'conversation_branches'): {
    insert(values: {
      conversation_id: string
      user_id: string
      parent_branch_id: string | null
      fork_message_id: string
    }): {
      select(columns: string): {
        single(): PromiseLike<BranchInsertResult>
      }
    }
  }
}

export async function createConversationBranch(
  client: BranchInsertClient,
  prepared: PreparedConversationEdit,
): Promise<CreatedConversationBranch> {
  if (
    !prepared.conversation_id.trim() ||
    !prepared.user_id.trim() ||
    !prepared.fork_message_id.trim() ||
    !prepared.revised_question.trim()
  ) {
    throw new Error('Invalid prepared conversation edit.')
  }

  const { data, error } = await client
    .from('conversation_branches')
    .insert({
      conversation_id: prepared.conversation_id,
      user_id: prepared.user_id,
      parent_branch_id: prepared.parent_branch_id,
      fork_message_id: prepared.fork_message_id,
    })
    .select(
      'id,conversation_id,user_id,parent_branch_id,fork_message_id',
    )
    .single()

  if (error || !data) {
    throw new Error('Conversation branch creation failed.')
  }

  if (
    !data.id ||
    data.conversation_id !== prepared.conversation_id ||
    data.user_id !== prepared.user_id ||
    data.parent_branch_id !== prepared.parent_branch_id ||
    data.fork_message_id !== prepared.fork_message_id
  ) {
    throw new Error('Created conversation branch verification failed.')
  }

  return data
}
