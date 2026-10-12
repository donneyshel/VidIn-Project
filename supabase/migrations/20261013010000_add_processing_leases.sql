-- Processing lease metadata for interrupted upload recovery.
-- This migration does not automatically refund reservations.

alter table public.usage_reservations
  add column if not exists lease_expires_at timestamptz;

alter table public.usage_reservations
  add column if not exists last_heartbeat_at timestamptz;

create index if not exists usage_reservations_expired_lease_idx
  on public.usage_reservations (lease_expires_at)
  where status = 'reserved';

comment on column public.usage_reservations.lease_expires_at is
  'Deadline after which an active processing claim requires reconciliation.';

comment on column public.usage_reservations.last_heartbeat_at is
  'Last confirmed heartbeat from the processing worker.';
