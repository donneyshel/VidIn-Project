import 'server-only'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasActiveSubscription } from '@/lib/billing/subscription-access'
import type { SubscriptionProduct } from '@/lib/billing/subscription-pricing'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export type PremiumAccessResult =
  | {
      authorized: true
      userId: string
      supabase: SupabaseClient
    }
  | {
      authorized: false
      response: NextResponse
    }

export async function requirePremiumAccess(
  product: SubscriptionProduct,
): Promise<PremiumAccessResult> {
  const supabase = await createClient()
  return checkPremiumAccess(product, supabase)
}

export async function checkPremiumAccess(
  product: SubscriptionProduct,
  supabase: SupabaseClient,
): Promise<PremiumAccessResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      ),
    }
  }

  const { data: subscription, error: subscriptionError } =
    await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .eq('product', product)
      .maybeSingle()

  if (subscriptionError) {
    console.error('Premium access verification failed:', {
      product,
      code: subscriptionError.code,
    })

    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unable to verify subscription access' },
        { status: 503 },
      ),
    }
  }

  if (!hasActiveSubscription(subscription)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: 'Active premium subscription required',
          requiredProduct: product,
        },
        { status: 403 },
      ),
    }
  }

  return {
    authorized: true,
    userId: user.id,
    supabase,
  }
}
