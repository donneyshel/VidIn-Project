-- Persist verified Ask VidIn evidence with its assistant message.
-- Existing messages remain valid without evidence.

alter table public.conversation_messages
  add column if not exists evidence jsonb;

comment on column public.conversation_messages.evidence is
  'Verified transcript and visual evidence returned with an assistant answer.';
