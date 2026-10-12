import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  paystackRequest,
  verifyPaystackSignature,
} from '@/lib/billing/paystack'

export const runtime = 'nodejs'

type PaystackEvent = {
  event?: string
  data?: { reference?: string }
}

type VerifiedTransaction = {
  id: number
  reference: string
  status: string
  amount: number
  currency: string
  paid_at: string | null
}

type WebhookDependencies = {
  createAdmin: typeof createAdminClient
  verifyTransaction: typeof paystackRequest
  verifySignature: typeof verifyPaystackSignature
}

const productionDependencies: WebhookDependencies = {
  createAdmin: createAdminClient,
  verifyTransaction: paystackRequest,
  verifySignature: verifyPaystackSignature,
}

export function createWebhookHandler(
  dependencies: WebhookDependencies = productionDependencies,
) {
  return async function handleWebhook(request: Request) {
    try {
    const rawBody = await request.text()

    if (rawBody.length > 100_000) {
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 },
      )
    }

    if (!dependencies.verifySignature(
      rawBody,
      request.headers.get('x-paystack-signature'),
    )) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 },
      )
    }

    let event: PaystackEvent

    try {
      event = JSON.parse(rawBody) as PaystackEvent
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 },
      )
    }

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true })
    }

    const reference = event.data?.reference

    const isPayg =
      typeof reference === 'string' &&
      /^vidin-payg-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(reference)

    const isSubscription =
      typeof reference === 'string' &&
      /^vidin-sub-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(reference)

    if (!isPayg && !isSubscription) {
      return NextResponse.json(
        { error: 'Invalid reference' },
        { status: 400 },
      )
    }

    const admin = dependencies.createAdmin()

    const { data: transaction, error: lookupError } = await admin
      .from('paystack_transactions')
      .select(
        'reference, transaction_type, status, amount_minor, currency, purchased_seconds, subscription_product, credited_at',
      )
      .eq('reference', reference)
      .single()

    if (lookupError || !transaction) {
      return NextResponse.json(
        { error: 'Unknown transaction' },
        { status: 404 },
      )
    }

    const validPayg =
      isPayg &&
      transaction.transaction_type === 'minute_purchase' &&
      Number.isSafeInteger(transaction.purchased_seconds) &&
      transaction.purchased_seconds > 0

    const validSubscription =
      isSubscription &&
      transaction.transaction_type === 'subscription' &&
      (transaction.subscription_product === 'creators' ||
        transaction.subscription_product === 'live') &&
      transaction.purchased_seconds === null

    if (!validPayg && !validSubscription) {
      return NextResponse.json(
        { error: 'Unexpected transaction type' },
        { status: 400 },
      )
    }

    const verified = await dependencies.verifyTransaction<VerifiedTransaction>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    )

    if (
      verified.status !== 'success' ||
      verified.reference !== reference ||
      !Number.isSafeInteger(verified.amount) ||
      verified.amount !== transaction.amount_minor ||
      verified.currency !== transaction.currency ||
      !Number.isSafeInteger(verified.id) ||
      verified.id <= 0 ||
      !verified.paid_at
    ) {
      console.error('Paystack verification mismatch:', reference)

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 422 },
      )
    }

    // Paystack verification must succeed before either settlement RPC.
    // Both database functions independently validate payment identity,
    // amount, currency and settlement state.
    const settlementFunction = validSubscription
      ? 'settle_verified_paystack_subscription'
      : 'settle_verified_paystack_purchase'

    const { error: settlementError } = await admin.rpc(
      settlementFunction,
      {
        p_reference: reference,
        p_amount_minor: verified.amount,
        p_currency: verified.currency,
        p_paystack_transaction_id: String(verified.id),
        p_paid_at: verified.paid_at,
      },
    )

    if (settlementError) {
      console.error('Paystack settlement failed:', settlementError)

      return NextResponse.json(
        { error: 'Payment settlement unavailable' },
        { status: 500 },
      )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Paystack webhook error:', error)

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    )
    }
  }
}

export const POST = createWebhookHandler()
