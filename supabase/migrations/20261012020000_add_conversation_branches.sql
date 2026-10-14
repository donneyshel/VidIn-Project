-- VidIn conversation branching foundation.
-- Existing conversations and messages remain unchanged.
-- Branch ownership is enforced through conversation ownership.

create table if not exists public.conversation_branches (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  parent_branch_id uuid
    references public.conversation_branches(id) on delete restrict,
  fork_message_id uuid
    references public.conversation_messages(id) on delete restrict,
  title text not null default 'Conversation branch',
  created_at timestamptz not null default now()
);

create index if not exists conversation_branches_conversation_idx
  on public.conversation_branches(conversation_id);

create index if not exists conversation_branches_user_idx
  on public.conversation_branches(user_id);

alter table public.conversation_branches
  enable row level security;

create policy "Users can view their own branches"
  on public.conversation_branches
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

create policy "Users can create their own branches"
  on public.conversation_branches
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

alter table public.conversation_messages
  add column if not exists branch_id uuid
  references public.conversation_branches(id)
  on delete restrict;

create index if not exists conversation_messages_branch_idx
  on public.conversation_messages(branch_id);


-- Enforce branch ownership and same-conversation relationships.
-- These checks protect against invalid direct database writes.

create or replace function public.validate_vidin_branch_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_conversation_id uuid;
  fork_conversation_id uuid;
begin
  if not exists (
    select 1
    from public.conversations c
    where c.id = new.conversation_id
      and c.user_id = new.user_id
  ) then
    raise exception 'Branch owner does not match conversation owner';
  end if;

  if new.parent_branch_id is not null then
    select b.conversation_id
      into parent_conversation_id
    from public.conversation_branches b
    where b.id = new.parent_branch_id
      and b.user_id = new.user_id;

    if parent_conversation_id is distinct from new.conversation_id then
      raise exception 'Parent branch belongs to another conversation';
    end if;

    if new.parent_branch_id = new.id then
      raise exception 'A branch cannot be its own parent';
    end if;
  end if;

  if new.fork_message_id is not null then
    select m.conversation_id
      into fork_conversation_id
    from public.conversation_messages m
    where m.id = new.fork_message_id
      and m.user_id = new.user_id;

    if fork_conversation_id is distinct from new.conversation_id then
      raise exception 'Fork message belongs to another conversation';
    end if;
  end if;

  return new;
end;
$$;

create trigger validate_vidin_branch_before_insert
before insert on public.conversation_branches
for each row
execute function public.validate_vidin_branch_relationships();

-- Branch relationships are immutable after creation.
-- This also prevents changing a branch into another user's branch.

create or replace function public.validate_vidin_message_branch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.branch_id is not null and not exists (
    select 1
    from public.conversation_branches b
    where b.id = new.branch_id
      and b.conversation_id = new.conversation_id
      and b.user_id = new.user_id
  ) then
    raise exception 'Message branch does not match conversation';
  end if;

  return new;
end;
$$;

create trigger validate_vidin_message_branch_before_insert
before insert on public.conversation_messages
for each row
execute function public.validate_vidin_message_branch();

create trigger validate_vidin_message_branch_before_update
before update of branch_id, conversation_id, user_id
on public.conversation_messages
for each row
execute function public.validate_vidin_message_branch();


-- Prevent modification of a branch's identity or ancestry.

create or replace function public.protect_vidin_branch_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.conversation_id is distinct from old.conversation_id
    or new.user_id is distinct from old.user_id
    or new.parent_branch_id is distinct from old.parent_branch_id
    or new.fork_message_id is distinct from old.fork_message_id
  then
    raise exception 'Conversation branch identity is immutable';
  end if;

  return new;
end;
$$;

create trigger protect_vidin_branch_identity_before_update
before update on public.conversation_branches
for each row
execute function public.protect_vidin_branch_identity();

-- Explicitly restrict updates and deletes to owned branches.

create policy "Users can update their own branches"
on public.conversation_branches
for update
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own branches"
on public.conversation_branches
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
