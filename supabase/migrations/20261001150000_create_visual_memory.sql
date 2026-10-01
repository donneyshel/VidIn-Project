create table if not exists public.visual_frames (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  frame_index integer not null,
  timestamp_seconds numeric not null default 0,

  image_url text,
  description text,

  created_at timestamptz not null default now()
);

create index if not exists visual_frames_recording_id_idx
  on public.visual_frames(recording_id);

create index if not exists visual_frames_user_id_idx
  on public.visual_frames(user_id);

create index if not exists visual_frames_timestamp_idx
  on public.visual_frames(recording_id, timestamp_seconds);


alter table public.visual_frames enable row level security;


drop policy if exists "Users can view their own visual frames"
on public.visual_frames;

create policy "Users can view their own visual frames"
on public.visual_frames
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create their own visual frames"
on public.visual_frames;

create policy "Users can create their own visual frames"
on public.visual_frames
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update their own visual frames"
on public.visual_frames;

create policy "Users can update their own visual frames"
on public.visual_frames
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete their own visual frames"
on public.visual_frames;

create policy "Users can delete their own visual frames"
on public.visual_frames
for delete
using (auth.uid() = user_id);



create table if not exists public.visual_events (
  id uuid primary key default gen_random_uuid(),

  recording_id uuid not null references public.recordings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  timestamp_seconds numeric not null default 0,

  event_type text,
  content text not null,

  created_at timestamptz not null default now()
);


create index if not exists visual_events_recording_id_idx
  on public.visual_events(recording_id);

create index if not exists visual_events_timestamp_idx
  on public.visual_events(recording_id, timestamp_seconds);


alter table public.visual_events enable row level security;


drop policy if exists "Users can view their own visual events"
on public.visual_events;

create policy "Users can view their own visual events"
on public.visual_events
for select
using (auth.uid() = user_id);


drop policy if exists "Users can create their own visual events"
on public.visual_events;

create policy "Users can create their own visual events"
on public.visual_events
for insert
with check (auth.uid() = user_id);


drop policy if exists "Users can update their own visual events"
on public.visual_events;

create policy "Users can update their own visual events"
on public.visual_events
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists "Users can delete their own visual events"
on public.visual_events;

create policy "Users can delete their own visual events"
on public.visual_events
for delete
using (auth.uid() = user_id);

