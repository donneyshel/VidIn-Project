import 'server-only'

export type SubscriptionAccessRecord = {
  status: string
  current_period_end: string | null
}

export function hasActiveSubscription(
  subscription: SubscriptionAccessRecord | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription || subscription.status !== 'active') {
    return false
  }

  if (!subscription.current_period_end) {
    return false
  }

  const expiry = Date.parse(subscription.current_period_end)

  return Number.isFinite(expiry) && expiry > now.getTime()
}
