-- Logs which signed-in member visited which page, and when — admin-only
-- visibility. Anonymous/landing-page traffic is deliberately not logged
-- here (the app only inserts a row when a real session exists); this is
-- about "who of my members is on the site," not general web analytics.
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now()
);

create index page_views_user_id_created_at_idx on public.page_views (user_id, created_at desc);
create index page_views_created_at_idx on public.page_views (created_at desc);

alter table public.page_views enable row level security;

-- Only admins can ever read this — it's a log of other members' activity.
create policy "Admins can read page views"
  on public.page_views for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin)
  );

-- Logged via a SECURITY DEFINER RPC (called from server-side middleware
-- with the visitor's own session) rather than a direct client insert
-- policy, so a client can't forge visits on another user's behalf or spam
-- arbitrary paths — the function always logs as the caller.
create function public.log_page_view(p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.page_views (user_id, path)
  values ((select auth.uid()), left(p_path, 500));
end;
$$;

revoke execute on function public.log_page_view(text) from public, anon;
grant execute on function public.log_page_view(text) to authenticated;
