import type { Metadata } from "next"
import { VaultLaunchBanner } from "@/components/vault-launch-banner"

export const metadata: Metadata = {
  title: 'Creators Vault — Vidin',
  description:
    'Dead content detection that flags retention drop-offs plus a viral hook extractor tuned for TikTok, Reels and Shorts.',
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6">
      <VaultLaunchBanner
        name="Creators Vault"
        date="December 11, 2026"
        description="Creator intelligence is coming. Prepare for smarter edits, stronger hooks, and deeper content insights."
      />
      <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
        This experience is not available yet.
        No subscription is required to view this announcement.
      </p>
    </main>
  )
}
