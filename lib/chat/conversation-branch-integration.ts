import {
  reconstructBranchHistory,
  type BranchMessage,
  type ConversationBranch,
} from './branch-history'

export type ChatOperation =
  | { kind: 'normal' }
  | { kind: 'edit'; editMessageId: string; branchId: string | null }
  | { kind: 'branch-reply'; branchId: string }

export type ChatHistoryEntry = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatBranchOption = {
  id: string | null
  label: string
}

export function classifyChatOperation(
  branchId: string | null,
  editMessageId: string | null,
): ChatOperation {
  if (editMessageId?.trim()) {
    return {
      kind: 'edit',
      editMessageId: editMessageId.trim(),
      branchId: branchId?.trim() || null,
    }
  }

  if (branchId?.trim()) {
    return {
      kind: 'branch-reply',
      branchId: branchId.trim(),
    }
  }

  return { kind: 'normal' }
}

export function selectChatBranchHistory(
  messages: BranchMessage[],
  branches: ConversationBranch[],
  branchId: string | null,
  limit = 30,
): ChatHistoryEntry[] {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('History limit must be a positive integer.')
  }

  return reconstructBranchHistory(
    messages,
    branches,
    branchId,
  )
    .slice(-limit)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

export function buildBranchResponse<T extends object>(
  payload: T,
  branchId: string | null,
): T & { branchId: string | null } {
  return {
    ...payload,
    branchId,
  }
}

export function buildEditRequest(
  recordingId: string,
  question: string,
  editMessageId: string,
  branchId: string | null,
) {
  if (
    !recordingId.trim() ||
    !question.trim() ||
    !editMessageId.trim()
  ) {
    throw new Error('Invalid conversation edit request.')
  }

  return {
    recordingId: recordingId.trim(),
    question: question.trim(),
    editMessageId: editMessageId.trim(),
    ...(branchId ? { branchId: branchId.trim() } : {}),
  }
}

export function buildBranchOptions(
  branches: ConversationBranch[],
): ChatBranchOption[] {
  const seen = new Set<string>()

  const options: ChatBranchOption[] = [
    { id: null, label: 'Original conversation' },
  ]

  for (const branch of branches) {
    if (!branch.id.trim() || seen.has(branch.id)) {
      throw new Error('Invalid or duplicate conversation branch.')
    }

    seen.add(branch.id)

    options.push({
      id: branch.id,
      label: `Version ${options.length}`,
    })
  }

  return options
}
