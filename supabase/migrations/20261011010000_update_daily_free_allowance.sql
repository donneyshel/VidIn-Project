-- Reduce VidIn's daily free allowance from 60 to 10 seconds.
-- Preserve purchased balances and existing account records.

begin;

-- Preserve previously recorded daily usage, including values
-- above the new 10-second allowance.
-- The existing database constraint permits up to 60 seconds.
-- The updated balance and reservation functions enforce 10 seconds.

create or replace function public.get_usage_balance()
returns table (
  purchased_seconds bigint,
  free_seconds_remaining integer,
  free_usage_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  account public.billing_accounts;
  today_utc date := (now() at time zone 'UTC')::date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.billing_accounts (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select *
  into account
  from public.billing_accounts
  where user_id = auth.uid();

  return query
  select
    account.purchased_seconds,
    case
      when account.daily_free_usage_date = today_utc
        then greatest(10 - account.daily_free_seconds_used, 0)
      else 10
    end::integer,
    account.daily_free_usage_date;
end;
$$;

commit;
