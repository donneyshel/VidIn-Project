-- Distinguish newly created processing reservations from retries.
-- Reservation creation and the created flag are atomic.

drop function public.reserve_usage(uuid, uuid, bigint);

create or replace function public.reserve_usage(
  p_user_id uuid,
  p_request_key uuid,
  p_seconds bigint
)
returns jsonb
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

    return jsonb_build_object(
      'reservation', to_jsonb(v_existing),
      'created', false
    );
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

  return jsonb_build_object(
    'reservation', to_jsonb(v_reservation),
    'created', true
  );
end;
$$;


revoke all on function public.reserve_usage(uuid, uuid, bigint)
  from public, anon, authenticated;

grant execute on function public.reserve_usage(uuid, uuid, bigint)
  to service_role;
