import { VIDIN_PRICING } from '@/lib/billing/pricing'

export type SubscriptionProduct = 'creators' | 'live'

export function isSubscriptionProduct(
  value: unknown,
): value is SubscriptionProduct {
  return value === 'creators' || value === 'live'
}

export function getSubscriptionUsdCents(
  product: SubscriptionProduct,
): number {
  switch (product) {
    case 'creators':
      return VIDIN_PRICING.creatorsVaultUsdCentsMonthly
    case 'live':
      return VIDIN_PRICING.liveEcosystemUsdCentsMonthly
  }
}

export function getSubscriptionName(
  product: SubscriptionProduct,
): string {
  switch (product) {
    case 'creators':
      return 'Creators Vault'
    case 'live':
      return 'Live Ecosystem'
  }
}
