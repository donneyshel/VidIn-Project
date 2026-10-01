create table if not exists public.transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index integer not null,
  start_time numeric not null default 0,
  end_time numeric not null default 0,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists transcript_chunks_recording_id_idx
  on public.transcript_chunks(recording_id);

create index if not exists transcript_chunks_user_id_idx
  on public.transcript_chunks(user_id);

create index if not exists transcript_chunks_recording_order_idx
  on public.transcript_chunks(recording_id, chunk_index);

alter table public.transcript_chunks enable row level security;

drop policy if exists "Users can view their own transcript chunks"
  on public.transcript_chunks;

create policy "Users can view their own transcript chunks"
  on public.transcript_chunks
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own transcript chunks"
  on public.transcript_chunks;

create policy "Users can create their own transcript chunks"
  on public.transcript_chunks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own transcript chunks"
  on public.transcript_chunks;

create policy "Users can update their own transcript chunks"
  on public.transcript_chunks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own transcript chunks"
  on public.transcript_chunks;

create policy "Users can delete their own transcript chunks"
  on public.transcript_chunks
  for delete
  using (auth.uid() = user_id);
