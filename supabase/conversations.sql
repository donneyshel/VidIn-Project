create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recording_id uuid not null references public.recordings(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx
  on public.conversations(user_id);

create index if not exists conversations_recording_id_idx
  on public.conversations(recording_id);

create unique index if not exists conversations_recording_id_unique_idx
  on public.conversations(recording_id);

create index if not exists conversations_updated_at_idx
  on public.conversations(updated_at desc);

alter table public.conversations enable row level security;

drop policy if exists "Users can view their own conversations"
  on public.conversations;

create policy "Users can view their own conversations"
  on public.conversations
  for select
  using (
    auth.uid() = user_id
  );

drop policy if exists "Users can create their own conversations"
  on public.conversations;

create policy "Users can create their own conversations"
  on public.conversations
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recordings r
      where r.id = recording_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own conversations"
  on public.conversations;

create policy "Users can update their own conversations"
  on public.conversations
  for update
  using (
    auth.uid() = user_id
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.recordings r
      where r.id = recording_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own conversations"
  on public.conversations;

create policy "Users can delete their own conversations"
  on public.conversations
  for delete
  using (
    auth.uid() = user_id
  );


create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists conversation_messages_conversation_id_idx
  on public.conversation_messages(conversation_id);

create index if not exists conversation_messages_user_id_idx
  on public.conversation_messages(user_id);

create index if not exists conversation_messages_created_at_idx
  on public.conversation_messages(created_at);

alter table public.conversation_messages enable row level security;

drop policy if exists "Users can view their own conversation messages"
  on public.conversation_messages;

create policy "Users can view their own conversation messages"
  on public.conversation_messages
  for select
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create their own conversation messages"
  on public.conversation_messages;

create policy "Users can create their own conversation messages"
  on public.conversation_messages
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own conversation messages"
  on public.conversation_messages;

create policy "Users can delete their own conversation messages"
  on public.conversation_messages
  for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );
