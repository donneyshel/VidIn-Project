-- Atomically settle independently verified one-month
-- VidIn premium subscription payments.
--
-- The trusted server must verify the Paystack transaction
-- directly before invoking this function.

create or replace function public.settle_verified_paystack_subscription(
  p_reference text,
  p_amount_minor bigint,
  p_currency text,
  p_paystack_transaction_id text,
  p_paid_at timestamptz
)
returns public.paystack_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tx public.paystack_transactions%rowtype;
  v_existing public.subscriptions%rowtype;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reference is null
     or p_reference !~
       '^vidin-sub-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
     or p_paystack_transaction_id is null
     or btrim(p_paystack_transaction_id) = ''
     or p_paid_at is null
     or p_paid_at > now() + interval '5 minutes'
     or p_paid_at < now() - interval '7 days' then
    raise exception 'Invalid subscription payment verification data';
  end if;

  select *
  into v_tx
  from public.paystack_transactions
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Subscription payment transaction not found';
  end if;

  if v_tx.transaction_type <> 'subscription'
     or v_tx.subscription_product not in ('creators', 'live')
     or v_tx.amount_minor is distinct from p_amount_minor
     or v_tx.currency is distinct from p_currency
     or v_tx.currency <> 'GHS'
     or v_tx.purchased_seconds is not null
     or v_tx.amount_minor <= 0 then
    raise exception 'Subscription payment verification mismatch';
  end if;

  if v_tx.status not in ('pending', 'success') then
    raise exception 'Subscription payment cannot be settled in this state';
  end if;

  if v_tx.paystack_transaction_id is not null
     and v_tx.paystack_transaction_id <> p_paystack_transaction_id then
    raise exception 'Paystack transaction ID mismatch';
  end if;

  -- A successfully settled payment must never grant another period.
  if v_tx.credited_at is not null then
    if v_tx.status <> 'success'
       or v_tx.paystack_transaction_id is distinct from
          p_paystack_transaction_id then
      raise exception 'Inconsistent settled subscription payment';
    end if;

    return v_tx;
  end if;

  -- Serialize payments for the same customer/product by locking
  -- the subscription row after ensuring it exists.
  insert into public.subscriptions (
    user_id,
    product,
    status
  )
  values (
    v_tx.user_id,
    v_tx.subscription_product,
    'inactive'
  )
  on conflict (user_id, product) do nothing;

  select *
  into v_existing
  from public.subscriptions
  where user_id = v_tx.user_id
    and product = v_tx.subscription_product
  for update;

  if not found then
    raise exception 'Subscription record could not be locked';
  end if;

  -- Preserve an already-paid period if another verified
  -- payment is processed before the current period expires.
  v_period_start := greatest(
    now(),
    coalesce(v_existing.current_period_end, now())
  );

  v_period_end := v_period_start + interval '1 month';

  update public.subscriptions
  set status = 'active',
      current_period_start = v_period_start,
      current_period_end = v_period_end,
      cancelled_at = null,
      updated_at = now()
  where id = v_existing.id;

  update public.paystack_transactions
  set status = 'success',
      paystack_transaction_id = p_paystack_transaction_id,
      paid_at = p_paid_at,
      credited_at = now(),
      updated_at = now()
  where id = v_tx.id
  returning * into v_tx;

  return v_tx;
end;
$$;

revoke all on function public.settle_verified_paystack_subscription(
  text, bigint, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.settle_verified_paystack_subscription(
  text, bigint, text, text, timestamptz
) to service_role;
