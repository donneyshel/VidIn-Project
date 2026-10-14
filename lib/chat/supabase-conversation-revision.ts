import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createConversationRevision,
  type ConversationRevisionClient,
  type CreatedConversationRevision,
} from './create-conversation-revision'
import {
  deleteCreatedBranch,
  type BranchDeleteClient,
} from './delete-created-branch'
import type {
  PreparedConversationEdit,
} from './prepare-conversation-edit'

export async function createSupabaseConversationRevision(
  supabase: SupabaseClient,
  prepared: PreparedConversationEdit,
): Promise<CreatedConversationRevision> {
  const client = {
    from: (table: 'conversation_branches' | 'conversation_messages') =>
      supabase.from(table),

    async deleteCreatedBranch(
      branchId: string,
      conversationId: string,
      userId: string,
    ) {
      return deleteCreatedBranch(
        supabase as unknown as BranchDeleteClient,
        branchId,
        conversationId,
        userId,
      )
    },
  } as unknown as ConversationRevisionClient

  return createConversationRevision(client, prepared)
}
