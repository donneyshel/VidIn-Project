/**
 * VidIn's official product prices in USD cents.
 *
 * Display currencies are estimates.
 * Paystack GHS checkout amounts must be calculated
 * and verified separately on the server.
 */

export const VIDIN_PRICING = {
  paygUsdCentsPerMinute: 9,
  creatorsVaultUsdCentsMonthly: 2999,
  liveEcosystemUsdCentsMonthly: 4999,
  dailyFreeSeconds: 10,
  maximumPurchaseMinutes: 1000,
} as const

export function calculatePaygUsdCents(minutes: number): number {
  if (
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > VIDIN_PRICING.maximumPurchaseMinutes
  ) {
    throw new Error('Minutes must be a whole number from 1 to 1000.')
  }

  return minutes * VIDIN_PRICING.paygUsdCentsPerMinute
}
