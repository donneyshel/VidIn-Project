import 'server-only'

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export type UsageReservation = {
  id: string
  user_id: string
  request_key: string
  status: 'reserved' | 'completed' | 'refunded'
  reserved_seconds: number
  free_seconds: number
  purchased_seconds: number
  recording_id: string | null
}

function billingError(
  operation: string,
  error: { message: string; code?: string },
): Error {
  if (error.message.includes('INSUFFICIENT_PROCESSING_BALANCE')) {
    return new Error('INSUFFICIENT_PROCESSING_BALANCE')
  }

  return new Error(`${operation}: ${error.message}`)
}

export async function reserveProcessingUsage(
  userId: string,
  durationSeconds: number,
  requestKey = randomUUID(),
): Promise<UsageReservation> {
  if (
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > 86400
  ) {
    throw new Error('Invalid processing duration.')
  }

  const admin = createAdminClient()

  const { data, error } = await admin.rpc('reserve_usage', {
    p_user_id: userId,
    p_request_key: requestKey,
    p_seconds: durationSeconds,
  })

  if (error) {
    throw billingError('Unable to reserve processing credits', error)
  }

  const reservation =
    data && typeof data === 'object' && 'reservation' in data
      ? data.reservation
      : data

  if (
    !reservation ||
    typeof reservation !== 'object' ||
    typeof reservation.id !== 'string'
  ) {
    throw new Error('Billing reservation returned no result.')
  }

  return reservation as UsageReservation
}

export type UsageReservationClaim = {
  reservation: UsageReservation
  created: boolean
}

export async function reserveProcessingUsageWithClaim(
  userId: string,
  durationSeconds: number,
  requestKey: string,
): Promise<UsageReservationClaim> {
  if (
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 1 ||
    durationSeconds > 86400
  ) {
    throw new Error('Invalid processing duration.')
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestKey,
    )
  ) {
    throw new Error('Invalid processing request ID.')
  }

  const admin = createAdminClient()

  const { data, error } = await admin.rpc('reserve_usage', {
    p_user_id: userId,
    p_request_key: requestKey,
    p_seconds: durationSeconds,
  })

  if (error) {
    throw billingError('Unable to reserve processing credits', error)
  }

  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.created !== 'boolean' ||
    !data.reservation ||
    typeof data.reservation.id !== 'string'
  ) {
    throw new Error('Billing reservation returned an unexpected result.')
  }

  return data as UsageReservationClaim
}

export async function completeProcessingUsage(
  reservationId: string,
  recordingId: string,
): Promise<UsageReservation> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('complete_usage', {
    p_reservation_id: reservationId,
    p_recording_id: recordingId,
  })

  if (error) {
    throw billingError('Unable to complete processing charge', error)
  }

  if (!data || data.status !== 'completed') {
    throw new Error('Billing completion returned an unexpected result.')
  }

  return data as UsageReservation
}

export async function refundProcessingUsage(
  reservationId: string,
): Promise<UsageReservation> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc('refund_usage', {
    p_reservation_id: reservationId,
  })

  if (error) {
    throw billingError('Unable to refund processing credits', error)
  }

  if (!data || data.status !== 'refunded') {
    throw new Error('Billing refund returned an unexpected result.')
  }

  return data as UsageReservation
}


export async function heartbeatProcessingUsage(
  reservationId: string
): Promise<void> {
  const admin = createAdminClient()

  const { error } = await admin.rpc("heartbeat_usage", {
    p_reservation_id: reservationId,
  })

  if (error) {
    throw billingError("Processing heartbeat failed", error)
  }
}

export async function cleanupFailedProcessing(
  reservationId: string,
  recordingId: string | null = null
) {
  if (!reservationId) {
    throw new Error('Missing processing reservation ID')
  }

  const admin = createAdminClient()

  const { data, error } = await admin.rpc(
    'cleanup_failed_processing',
    {
      p_reservation_id: reservationId,
      p_recording_id: recordingId,
    }
  )

  if (error) {
    throw new Error(
      `Atomic processing cleanup failed: ${error.message}`
    )
  }

  if (!data) {
    throw new Error(
      'Atomic processing cleanup returned no reservation'
    )
  }

  return data
}
