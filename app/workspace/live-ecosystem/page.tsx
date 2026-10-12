import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'

export default async function PremiumWorkspacePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .eq('product', 'live')
    .maybeSingle()

  if (error) {
    console.error('Premium subscription access check failed:', error)

    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-12">
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-2xl font-semibold">
            Unable to verify subscription
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We could not verify your premium access. Please try again.
          </p>
          <Link
            href="/workspace/billing"
            className="mt-6 inline-block text-sm font-medium underline"
          >
            Return to billing
          </Link>
        </div>
      </main>
    )
  }

  const active = hasActiveSubscription(subscription)

  if (!active) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-12">
        <div className="glass-card rounded-2xl p-8 sm:p-10">
          <LockKeyhole className="size-8 text-muted-foreground" />

          <h1 className="mt-6 text-3xl font-semibold">
            Live Ecosystem is locked
          </h1>

          <p className="mt-3 max-w-xl text-muted-foreground">
            An active Live Ecosystem subscription is required to access
            this premium workspace.
          </p>

          <Link
            href="/workspace/billing"
            className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            View subscription options
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-12">
      <div className="glass-card rounded-2xl p-8 sm:p-10">
        <ShieldCheck className="size-8" />

        <p className="mt-5 text-sm font-medium text-muted-foreground">
          Premium subscription verified
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Live Ecosystem
        </h1>

        <p className="mt-4 text-muted-foreground">
          Your premium live intelligence workspace.
        </p>

        <p className="mt-5 text-sm text-muted-foreground">
          Your subscription is active. Premium tools will appear
          here as they are implemented.
        </p>

        <Link
          href="/workspace/billing"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Manage billing
        </Link>
      </div>
    </main>
  )
}
