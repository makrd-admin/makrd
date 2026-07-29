-- 1:1 direct messages between two specific members. Same trivial-RLS
-- pattern as community_messages, just scoped to the pair instead of
-- everyone: a user can only ever read messages where they're the sender or
-- the recipient, and can only ever insert as themselves.
create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now(),
  constraint direct_messages_not_self check (sender_id <> recipient_id)
);

create index direct_messages_participants_idx
  on public.direct_messages (sender_id, recipient_id, created_at);
create index direct_messages_recipient_idx
  on public.direct_messages (recipient_id, sender_id, created_at);

alter table public.direct_messages enable row level security;

create policy "Users can read their own direct messages"
  on public.direct_messages for select
  to authenticated
  using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));

create policy "Users can send direct messages as themselves"
  on public.direct_messages for insert
  to authenticated
  with check (sender_id = (select auth.uid()));

alter publication supabase_realtime add table public.direct_messages;
