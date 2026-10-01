create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source_type text not null default 'upload',
  source_url text,
  transcript text,
  segments jsonb not null default '[]'::jsonb,
  duration_seconds numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recordings_user_id_idx
  on public.recordings(user_id);

create index if not exists recordings_created_at_idx
  on public.recordings(created_at desc);

alter table public.recordings enable row level security;

drop policy if exists "Users can view their own recordings"
  on public.recordings;

create policy "Users can view their own recordings"
  on public.recordings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own recordings"
  on public.recordings;

create policy "Users can create their own recordings"
  on public.recordings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own recordings"
  on public.recordings;

create policy "Users can update their own recordings"
  on public.recordings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own recordings"
  on public.recordings;

create policy "Users can delete their own recordings"
  on public.recordings
  for delete
  using (auth.uid() = user_id);
