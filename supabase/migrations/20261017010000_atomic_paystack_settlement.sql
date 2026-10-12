
-- Prevent one Paystack transaction ID from funding multiple purchases.
create unique index if not exists paystack_transactions_provider_id_unique
on public.paystack_transactions (paystack_transaction_id)
where paystack_transaction_id is not null;

create or replace function public.settle_verified_paystack_purchase(
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
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reference is null or btrim(p_reference) = ''
     or p_paystack_transaction_id is null
     or btrim(p_paystack_transaction_id) = ''
     or p_paid_at is null then
    raise exception 'Invalid payment verification data';
  end if;

  select *
  into v_tx
  from public.paystack_transactions
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Payment transaction not found';
  end if;

  if v_tx.transaction_type <> 'minute_purchase'
     or v_tx.amount_minor is distinct from p_amount_minor
     or v_tx.currency is distinct from p_currency
     or v_tx.currency <> 'GHS'
     or v_tx.purchased_seconds is null
     or v_tx.purchased_seconds <= 0 then
    raise exception 'Payment verification mismatch';
  end if;

  if v_tx.status not in ('pending', 'success') then
    raise exception 'Payment cannot be settled in this state';
  end if;

  if v_tx.paystack_transaction_id is not null
     and v_tx.paystack_transaction_id <> p_paystack_transaction_id then
    raise exception 'Paystack transaction ID mismatch';
  end if;

  if v_tx.credited_at is not null then
    if v_tx.status <> 'success'
       or v_tx.paystack_transaction_id is distinct from
          p_paystack_transaction_id then
      raise exception 'Inconsistent credited payment state';
    end if;

    return v_tx;
  end if;

  update public.paystack_transactions
  set status = 'success',
      paystack_transaction_id = p_paystack_transaction_id,
      paid_at = p_paid_at,
      updated_at = now()
  where id = v_tx.id;

  insert into public.billing_accounts (user_id)
  values (v_tx.user_id)
  on conflict (user_id) do nothing;

  update public.billing_accounts
  set purchased_seconds =
      purchased_seconds + v_tx.purchased_seconds,
      updated_at = now()
  where user_id = v_tx.user_id;

  insert into public.minute_ledger (
    user_id,
    entry_type,
    seconds_delta,
    payment_reference,
    description
  )
  values (
    v_tx.user_id,
    'purchase',
    v_tx.purchased_seconds,
    v_tx.reference,
    'Verified Paystack PAYG purchase'
  );

  update public.paystack_transactions
  set credited_at = now(),
      updated_at = now()
  where id = v_tx.id
  returning * into v_tx;

  return v_tx;
end;
$$;

revoke all on function public.settle_verified_paystack_purchase(
  text, bigint, text, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.settle_verified_paystack_purchase(
  text, bigint, text, text, timestamptz
) to service_role;
