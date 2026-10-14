import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BranchMessage,
  ConversationBranch,
} from './branch-history'
import type { BranchHistorySource } from './load-branch-history'

const PAGE_SIZE = 500

export function createSupabaseBranchHistorySource(
  supabase: SupabaseClient,
): BranchHistorySource {
  return {
    async loadMessages(conversationId, userId) {
      const messages: BranchMessage[] = []

      for (let offset = 0; ; offset += PAGE_SIZE) {
        const query = supabase
          .from('conversation_messages')

        const { data, error } =
          process.env.VIDIN_CHAT_EVIDENCE_ENABLED === 'true'
            ? await query
                .select('id,role,content,created_at,branch_id,evidence')
                .eq('conversation_id', conversationId)
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
                .order('id', { ascending: true })
                .range(offset, offset + PAGE_SIZE - 1)
            : await query
                .select('id,role,content,created_at,branch_id')
                .eq('conversation_id', conversationId)
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
                .order('id', { ascending: true })
                .range(offset, offset + PAGE_SIZE - 1)

        if (error) {
          throw new Error('Failed to load branch conversation messages.')
        }

        const page = (data ?? []) as BranchMessage[]
        messages.push(...page)

        if (page.length < PAGE_SIZE) {
          break
        }
      }

      return messages
    },

    async loadBranches(conversationId, userId) {
      const branches: ConversationBranch[] = []

      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('conversation_branches')
          .select('id,parent_branch_id,fork_message_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1)

        if (error) {
          throw new Error('Failed to load conversation branches.')
        }

        const page = (data ?? []) as ConversationBranch[]
        branches.push(...page)

        if (page.length < PAGE_SIZE) {
          break
        }
      }

      return branches
    },
  }
}
