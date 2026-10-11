-- VidIn PAYG processing reservations
-- All balance mutations must occur through trusted server operations.

create table public.usage_reservations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id) on delete cascade,

  request_key uuid not null,

  status text not null default 'reserved'
    check (status in ('reserved', 'completed', 'refunded')),

  reserved_seconds bigint not null
    check (reserved_seconds > 0),

  free_seconds bigint not null default 0
    check (free_seconds >= 0),

  purchased_seconds bigint not null default 0
    check (purchased_seconds >= 0),

  free_usage_date date not null,

  recording_id uuid
    references public.recordings(id) on delete set null,

  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz,

  free_seconds_restored integer not null default 0
    check (free_seconds_restored >= 0),

  constraint usage_reservations_allocation_check
    check (free_seconds + purchased_seconds = reserved_seconds),

  constraint usage_reservations_request_unique
    unique (user_id, request_key)
);

create index usage_reservations_user_created_idx
  on public.usage_reservations(user_id, created_at desc);

create index usage_reservations_status_idx
  on public.usage_reservations(status);

alter table public.usage_reservations
  enable row level security;

create policy "Users can read own usage reservations"
  on public.usage_reservations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Prevent direct client mutations.
revoke all on public.usage_reservations
  from public, anon, authenticated;

grant select on public.usage_reservations
  to authenticated;

-- No INSERT, UPDATE, or DELETE grants for browser clients.
-- Trusted billing functions will handle these operations.

-- =========================================================
-- ATOMIC USAGE RESERVATION
-- =========================================================

create or replace function public.reserve_usage(
  p_user_id uuid,
  p_request_key uuid,
  p_seconds bigint
)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account public.billing_accounts%rowtype;
  v_existing public.usage_reservations%rowtype;
  v_reservation public.usage_reservations%rowtype;
  v_today date := (now() at time zone 'UTC')::date;
  v_free_available integer;
  v_free_to_use bigint;
  v_purchased_to_use bigint;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_user_id is null or p_request_key is null then
    raise exception 'Missing reservation identifiers';
  end if;

  if p_seconds is null or p_seconds <= 0 or p_seconds > 86400 then
    raise exception 'Invalid processing duration';
  end if;

  insert into public.billing_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_account
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  select *
  into v_existing
  from public.usage_reservations
  where user_id = p_user_id
    and request_key = p_request_key;

  if found then
    if v_existing.reserved_seconds <> p_seconds then
      raise exception 'Reservation request mismatch';
    end if;

    return v_existing;
  end if;

  if v_account.daily_free_usage_date = v_today then
    v_free_available := greatest(
      10 - v_account.daily_free_seconds_used,
      0
    );
  else
    v_free_available := 10;
  end if;

  v_free_to_use := least(p_seconds, v_free_available);
  v_purchased_to_use := p_seconds - v_free_to_use;

  if v_account.purchased_seconds < v_purchased_to_use then
    raise exception 'INSUFFICIENT_PROCESSING_BALANCE';
  end if;

  update public.billing_accounts
  set
    purchased_seconds = purchased_seconds - v_purchased_to_use,
    daily_free_seconds_used =
      case
        when daily_free_usage_date = v_today
          then daily_free_seconds_used + v_free_to_use::integer
        else v_free_to_use::integer
      end,
    daily_free_usage_date = v_today,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.usage_reservations (
    user_id,
    request_key,
    reserved_seconds,
    free_seconds,
    purchased_seconds,
    free_usage_date
  )
  values (
    p_user_id,
    p_request_key,
    p_seconds,
    v_free_to_use,
    v_purchased_to_use,
    v_today
  )
  returning * into v_reservation;

  if v_purchased_to_use > 0 then
    insert into public.minute_ledger (
      user_id,
      entry_type,
      seconds_delta,
      description
    )
    values (
      p_user_id,
      'usage',
      -v_purchased_to_use,
      'Processing reservation ' || v_reservation.id::text
    );
  end if;

  return v_reservation;
end;
$$;

revoke all on function public.reserve_usage(uuid, uuid, bigint)
  from public, anon, authenticated;

grant execute on function public.reserve_usage(uuid, uuid, bigint)
  to service_role;

-- =========================================================
-- COMPLETE USAGE RESERVATION
-- =========================================================

create or replace function public.complete_usage(
  p_reservation_id uuid,
  p_recording_id uuid
)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.usage_reservations%rowtype;
  v_recording_user_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reservation_id is null or p_recording_id is null then
    raise exception 'Missing completion identifiers';
  end if;

  select *
  into v_reservation
  from public.usage_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found';
  end if;

  if v_reservation.status = 'refunded' then
    raise exception 'Cannot complete a refunded reservation';
  end if;

  select user_id
  into v_recording_user_id
  from public.recordings
  where id = p_recording_id;

  if not found or v_recording_user_id <> v_reservation.user_id then
    raise exception 'Recording does not belong to reservation owner';
  end if;

  if v_reservation.status = 'completed' then
    if v_reservation.recording_id <> p_recording_id then
      raise exception 'Reservation already completed for another recording';
    end if;

    return v_reservation;
  end if;

  update public.usage_reservations
  set
    status = 'completed',
    recording_id = p_recording_id,
    completed_at = now()
  where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke all on function public.complete_usage(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.complete_usage(uuid, uuid)
  to service_role;

-- =========================================================
-- REFUND USAGE RESERVATION
-- =========================================================

create or replace function public.refund_usage(
  p_reservation_id uuid
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
  v_today date := (now() at time zone 'UTC')::date;
  v_free_restored integer := 0;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reservation_id is null then
    raise exception 'Missing reservation identifier';
  end if;

  select user_id
  into v_user_id
  from public.usage_reservations
  where id = p_reservation_id;

  if not found then
    raise exception 'Reservation not found';
  end if;

  -- Lock the billing account before locking the reservation.
  select *
  into strict v_account
  from public.billing_accounts
  where user_id = v_user_id
  for update;

  select *
  into v_reservation
  from public.usage_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Reservation not found';
  end if;

  if v_reservation.status = 'refunded' then
    return v_reservation;
  end if;

  if v_reservation.status = 'completed' then
    raise exception 'Cannot refund a completed reservation';
  end if;

  -- Only restore free seconds belonging to the current UTC day.
  if v_reservation.free_usage_date = v_today
     and v_account.daily_free_usage_date = v_today then
    v_free_restored := least(
      v_reservation.free_seconds::integer,
      v_account.daily_free_seconds_used
    );
  end if;

  update public.billing_accounts
  set
    purchased_seconds =
      purchased_seconds + v_reservation.purchased_seconds,
    daily_free_seconds_used =
      case
        when daily_free_usage_date = v_today
          then daily_free_seconds_used - v_free_restored
        else daily_free_seconds_used
      end,
    updated_at = now()
  where user_id = v_user_id;

  if v_reservation.purchased_seconds > 0 then
    insert into public.minute_ledger (
      user_id,
      entry_type,
      seconds_delta,
      description
    )
    values (
      v_user_id,
      'refund',
      v_reservation.purchased_seconds,
      'Processing refund ' || v_reservation.id::text
    );
  end if;

  update public.usage_reservations
  set
    status = 'refunded',
    refunded_at = now(),
    free_seconds_restored = v_free_restored
  where id = p_reservation_id
  returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke all on function public.refund_usage(uuid)
  from public, anon, authenticated;

grant execute on function public.refund_usage(uuid)
  to service_role;
