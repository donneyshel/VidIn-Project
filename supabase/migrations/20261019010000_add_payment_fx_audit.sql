-- Preserve the official USD price and conversion details
-- used when a PAYG or premium subscription checkout begins.
-- Nullable columns preserve compatibility with older transactions.

alter table public.paystack_transactions
  add column if not exists base_currency text,
  add column if not exists base_amount_cents bigint,
  add column if not exists exchange_rate_usd_ghs numeric(18, 8),
  add column if not exists exchange_rate_updated_at timestamptz;

alter table public.paystack_transactions
  add constraint paystack_transactions_base_currency_check
    check (
      base_currency is null
      or base_currency = 'USD'
    ),
  add constraint paystack_transactions_base_amount_check
    check (
      base_amount_cents is null
      or base_amount_cents > 0
    ),
  add constraint paystack_transactions_exchange_rate_check
    check (
      exchange_rate_usd_ghs is null
      or exchange_rate_usd_ghs > 0
    ),
  add constraint paystack_transactions_fx_audit_complete_check
    check (
      (
        base_currency is null
        and base_amount_cents is null
        and exchange_rate_usd_ghs is null
        and exchange_rate_updated_at is null
      )
      or
      (
        base_currency = 'USD'
        and base_amount_cents is not null
        and exchange_rate_usd_ghs is not null
        and exchange_rate_updated_at is not null
      )
    );
