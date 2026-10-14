import {
  assertBranchOwnership,
  type BranchAuthorizationContext,
} from './branch-authorization'

export type BranchRecord = {
  id: string
  conversation_id: string
  user_id: string
  parent_branch_id: string | null
  fork_message_id: string | null
}

export type BranchLookupResult = {
  data: BranchRecord | null
  error: unknown
}

export type BranchLookupClient = {
  from(table: 'conversation_branches'): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          eq(column: string, value: string): {
            maybeSingle(): PromiseLike<BranchLookupResult>
          }
        }
      }
    }
  }
}

export async function loadAuthorizedBranch(
  supabase: BranchLookupClient,
  branchId: string,
  context: BranchAuthorizationContext,
): Promise<BranchRecord> {
  if (!branchId.trim()) {
    throw new Error('A conversation branch ID is required.')
  }

  const { data, error } = await supabase
    .from('conversation_branches')
    .select(
      'id,conversation_id,user_id,parent_branch_id,fork_message_id',
    )
    .eq('id', branchId)
    .eq('conversation_id', context.conversationId)
    .eq('user_id', context.userId)
    .maybeSingle()

  if (error) {
    throw new Error('Conversation branch lookup failed.')
  }

  if (data && data.id !== branchId) {
    throw new Error('Conversation branch identity mismatch.')
  }

  assertBranchOwnership(data, context)

  return data!
}
