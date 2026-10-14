export type BranchMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  branch_id: string | null
  evidence?: unknown
}

export type ConversationBranch = {
  id: string
  parent_branch_id: string | null
  fork_message_id: string | null
}

export function reconstructBranchHistory(
  messages: BranchMessage[],
  branches: ConversationBranch[],
  activeBranchId: string | null,
): BranchMessage[] {
  const messageIds = new Set<string>()

  for (const message of messages) {
    if (messageIds.has(message.id)) {
      throw new Error('Duplicate conversation message ID.')
    }

    messageIds.add(message.id)
  }

  const branchIds = new Set<string>()

  for (const branch of branches) {
    if (branchIds.has(branch.id)) {
      throw new Error('Duplicate conversation branch ID.')
    }

    branchIds.add(branch.id)
  }

  const sortedMessages = [...messages].sort((a, b) => {
    const timeComparison =
      a.created_at.localeCompare(b.created_at)

    return timeComparison || a.id.localeCompare(b.id)
  })

  const branchMap = new Map(
    branches.map((branch) => [branch.id, branch]),
  )

  function collect(
    branchId: string | null,
    visited: Set<string>,
  ): BranchMessage[] {
    if (branchId === null) {
      return sortedMessages.filter(
        (message) => message.branch_id === null,
      )
    }

    if (visited.has(branchId)) {
      throw new Error('Conversation branch cycle detected.')
    }

    const branch = branchMap.get(branchId)

    if (!branch) {
      throw new Error('Conversation branch not found.')
    }

    const nextVisited = new Set(visited)
    nextVisited.add(branchId)

    const inherited = collect(
      branch.parent_branch_id,
      nextVisited,
    )

    if (!branch.fork_message_id) {
      throw new Error('Conversation branch fork point missing.')
    }

    const forkIndex = inherited.findIndex(
      (message) => message.id === branch.fork_message_id,
    )

    if (forkIndex === -1) {
      throw new Error('Conversation branch fork point not found.')
    }

    if (inherited[forkIndex].role !== 'user') {
      throw new Error('Conversation branch must fork from a user question.')
    }

    // Editing excludes the original question and everything after it.
    const beforeFork = inherited.slice(0, forkIndex)

    const ownMessages = sortedMessages.filter(
      (message) => message.branch_id === branchId,
    )

    return [...beforeFork, ...ownMessages]
  }

  return collect(activeBranchId, new Set())
}
