-- Renew the lease of an actively processing reservation.
-- Only the server-side service role may call this function.
-- This function does not complete, charge, or refund a reservation.

create or replace function public.heartbeat_usage(
  p_reservation_id uuid
)
returns public.usage_reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.usage_reservations%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reservation_id is null then
    raise exception 'Missing reservation ID';
  end if;

  update public.usage_reservations
  set
    last_heartbeat_at = now(),
    lease_expires_at = now() + interval '10 minutes'
  where id = p_reservation_id
    and status = 'reserved'
  returning * into v_reservation;

  if not found then
    raise exception 'Reservation is not active';
  end if;

  return v_reservation;
end;
$$;

revoke all on function public.heartbeat_usage(uuid)
  from public, anon, authenticated;

grant execute on function public.heartbeat_usage(uuid)
  to service_role;
