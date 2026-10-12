create or replace function public.credit_paystack_purchase(
  p_reference text
)
returns public.paystack_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_transaction public.paystack_transactions%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Unauthorized billing operation';
  end if;

  if p_reference is null or btrim(p_reference) = '' then
    raise exception 'Missing payment reference';
  end if;

  select *
  into v_transaction
  from public.paystack_transactions
  where reference = p_reference
  for update;

  if not found then
    raise exception 'Payment transaction not found';
  end if;

  if v_transaction.transaction_type <> 'minute_purchase'
     or v_transaction.status <> 'success' then
    raise exception 'Payment not eligible for credit';
  end if;

  if v_transaction.credited_at is not null then
    return v_transaction;
  end if;

  if coalesce(v_transaction.purchased_seconds, 0) <= 0 then
    raise exception 'Invalid purchased seconds';
  end if;

  insert into public.billing_accounts (user_id)
  values (v_transaction.user_id)
  on conflict (user_id) do nothing;

  update public.billing_accounts
  set purchased_seconds =
      purchased_seconds + v_transaction.purchased_seconds,
      updated_at = now()
  where user_id = v_transaction.user_id;

  insert into public.minute_ledger (
    user_id, entry_type, seconds_delta,
    payment_reference, description
  )
  values (
    v_transaction.user_id,
    'purchase',
    v_transaction.purchased_seconds,
    v_transaction.reference,
    'Verified Paystack PAYG purchase'
  );

  update public.paystack_transactions
  set credited_at = now(),
      updated_at = now()
  where id = v_transaction.id
  returning * into v_transaction;

  return v_transaction;
end;
$$;

revoke all on function public.credit_paystack_purchase(text)
from public, anon, authenticated;

grant execute on function public.credit_paystack_purchase(text)
to service_role;
