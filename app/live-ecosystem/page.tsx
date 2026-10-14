import type { Metadata } from "next"
import { VaultLaunchBanner } from "@/components/vault-launch-banner"

export const metadata: Metadata = {
  title: 'Live Ecosystem — Vidin',
  description:
    'A live audio stream terminal and a macro prediction engine matching real-time financial broadcasts to historical market outcomes.',
}

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-12 sm:px-6">
      <VaultLaunchBanner
        name="Live Ecosystem"
        date="January 11, 2027"
        description="Real-time intelligence is coming. Prepare for live insights and a more connected VidIn experience."
      />
      <p className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
        This experience is not available yet.
        No subscription is required to view this announcement.
      </p>
    </main>
  )
}
