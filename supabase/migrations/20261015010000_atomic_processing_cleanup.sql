-- Atomically clean up failed processing and refund credits.
-- Only callable with the service-role JWT.

create or replace function public.cleanup_failed_processing(
  p_reservation_id uuid,
  p_recording_id uuid default null
)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_account public.billing_accounts%rowtype;
  v_reservation public.usage_reservations%rowtype;
  v_recording_owner uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reservation_id is null then
    raise exception 'Missing reservation identifier';
  end if;

  select user_id into v_user_id
  from public.usage_reservations
  where id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found';
  end if;

  -- Match the lock order used by refund_usage:
  -- billing account first, reservation second.
  select * into strict v_account
  from public.billing_accounts
  where user_id = v_user_id
  for update;

  select * into v_reservation
  from public.usage_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found';
  end if;

  -- Never delete a completed recording.
  if v_reservation.status <> 'reserved' then
    return v_reservation;
  end if;

  if p_recording_id is not null then
    select user_id into v_recording_owner
    from public.recordings
    where id = p_recording_id
    for update;

    if found then
      if v_recording_owner <> v_user_id then
        raise exception 'Recording ownership mismatch';
      end if;

      delete from public.recordings
      where id = p_recording_id
        and user_id = v_user_id;
    end if;
  end if;

  -- Reuse the existing idempotent refund function.
  -- This runs in the same transaction.
  return public.refund_usage(p_reservation_id);
end;
$$;

revoke all on function public.cleanup_failed_processing(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.cleanup_failed_processing(uuid, uuid)
  to service_role;
