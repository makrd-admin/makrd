-- A single public community channel — any signed-in maKr can read and post.
-- Not 1:1 DMs (that needs its own privacy-reviewed design later); this is a
-- shared town-square chat, which keeps the RLS trivial: everyone reads
-- everything, everyone can only write as themselves.
create table public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index community_messages_created_at_idx on public.community_messages (created_at);

alter table public.community_messages enable row level security;

create policy "Any signed-in maKr can read community messages"
  on public.community_messages for select
  to authenticated
  using (true);

create policy "Users can post their own community messages"
  on public.community_messages for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- No update/delete policy for v1 — messages are permanent once posted.

alter publication supabase_realtime add table public.community_messages;
