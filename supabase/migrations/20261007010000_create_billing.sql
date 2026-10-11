-- VidIn billing foundation
-- Core usage:
--   1 free minute per UTC day
--   purchased PAYG minutes do not expire
--
-- Premium access:
--   creators = Creators Vault
--   live     = Live Ecosystem

create table if not exists public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,

  purchased_seconds bigint not null default 0
    check (purchased_seconds >= 0),

  daily_free_seconds_used integer not null default 0
    check (
      daily_free_seconds_used >= 0
      and daily_free_seconds_used <= 60
    ),

  daily_free_usage_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.minute_ledger (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  entry_type text not null
    check (
      entry_type in (
        'purchase',
        'usage',
        'refund',
        'adjustment'
      )
    ),

  -- Positive values add purchased usage time.
  -- Negative values consume/remove purchased usage time.
  seconds_delta bigint not null
    check (seconds_delta <> 0),

  recording_id uuid references public.recordings(id) on delete set null,

  payment_reference text,

  description text,

  created_at timestamptz not null default now()
);

create index if not exists minute_ledger_user_id_idx
  on public.minute_ledger(user_id);

create index if not exists minute_ledger_created_at_idx
  on public.minute_ledger(created_at desc);

create unique index if not exists minute_ledger_payment_reference_idx
  on public.minute_ledger(payment_reference)
  where payment_reference is not null;


create table if not exists public.paystack_transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  reference text not null unique,

  transaction_type text not null
    check (
      transaction_type in (
        'minute_purchase',
        'subscription'
      )
    ),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'success',
        'failed',
        'abandoned',
        'reversed'
      )
    ),

  -- Paystack amounts are stored in the currency's smallest unit.
  amount_minor bigint not null
    check (amount_minor >= 0),

  currency text not null default 'GHS',

  purchased_seconds bigint
    check (
      purchased_seconds is null
      or purchased_seconds > 0
    ),

  subscription_product text
    check (
      subscription_product is null
      or subscription_product in ('creators', 'live')
    ),

  paystack_transaction_id text,

  paid_at timestamptz,

  credited_at timestamptz,

  raw_payload jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paystack_transactions_user_id_idx
  on public.paystack_transactions(user_id);

create index if not exists paystack_transactions_status_idx
  on public.paystack_transactions(status);


create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  product text not null
    check (product in ('creators', 'live')),

  status text not null default 'inactive'
    check (
      status in (
        'inactive',
        'active',
        'past_due',
        'cancelled'
      )
    ),

  paystack_customer_code text,
  paystack_subscription_code text,
  paystack_email_token text,

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, product)
);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions(status);


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.billing_accounts enable row level security;
alter table public.minute_ledger enable row level security;
alter table public.paystack_transactions enable row level security;
alter table public.subscriptions enable row level security;


-- Users may read their billing summary.
create policy "Users can read own billing account"
on public.billing_accounts
for select
using (auth.uid() = user_id);


-- Users may read their own ledger.
create policy "Users can read own minute ledger"
on public.minute_ledger
for select
using (auth.uid() = user_id);


-- Users may read their own payment history.
create policy "Users can read own Paystack transactions"
on public.paystack_transactions
for select
using (auth.uid() = user_id);


-- Users may read their own subscriptions.
create policy "Users can read own subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);


-- Intentionally no client INSERT/UPDATE/DELETE policies for:
--   billing_accounts
--   minute_ledger
--   paystack_transactions
--   subscriptions
--
-- Billing mutations will be performed through controlled database
-- functions / trusted server payment flows rather than direct browser
-- writes.


-- =========================================================
-- BILLING ACCOUNT INITIALIZATION
-- =========================================================

create or replace function public.ensure_billing_account()
returns public.billing_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  account public.billing_accounts;
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

  return account;
end;
$$;

revoke all on function public.ensure_billing_account() from public;
grant execute on function public.ensure_billing_account() to authenticated;


-- =========================================================
-- DAILY FREE MINUTE STATUS
-- =========================================================

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
        then greatest(60 - account.daily_free_seconds_used, 0)
      else 60
    end::integer,
    account.daily_free_usage_date;
end;
$$;

revoke all on function public.get_usage_balance() from public;
grant execute on function public.get_usage_balance() to authenticated;
