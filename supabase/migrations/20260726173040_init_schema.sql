-- v1 schema: profiles, printers, jobs, points_ledger + RLS.
-- See CLAUDE.md "Data model" for the starting point this implements.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  location text,
  points_balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Auto-create a profile row whenever a new auth user signs up (e.g. via Google OAuth).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- printers
-- ---------------------------------------------------------------------------
create table public.printers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  build_volume text,
  materials text[] not null default '{}',
  model_id text not null unique,
  code_word_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint printers_status_check check (status in ('active', 'inactive'))
);

alter table public.printers enable row level security;

create policy "Printers are viewable by any authenticated user"
  on public.printers for select
  to authenticated
  using (true);

create policy "Owners can insert their own printers"
  on public.printers for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners can update their own printers"
  on public.printers for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners can delete their own printers"
  on public.printers for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid references public.profiles (id) on delete set null,
  model_file text not null,
  material text not null,
  quantity integer not null default 1,
  est_points integer not null,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_quantity_check check (quantity > 0),
  constraint jobs_status_check check (
    status in ('submitted', 'accepted', 'printing', 'verification', 'completed', 'cancelled')
  )
);

alter table public.jobs enable row level security;

-- Open jobs are publicly browsable by any authenticated member looking for work;
-- requesters and the assigned provider can always see their own jobs.
create policy "Open jobs and own jobs are viewable"
  on public.jobs for select
  to authenticated
  using (
    status = 'submitted'
    or requester_id = (select auth.uid())
    or provider_id = (select auth.uid())
  );

create policy "Requesters can insert their own jobs"
  on public.jobs for insert
  to authenticated
  with check (requester_id = (select auth.uid()));

create policy "Requesters and providers can update their own jobs"
  on public.jobs for update
  to authenticated
  using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()))
  with check (requester_id = (select auth.uid()) or provider_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- points_ledger
-- ---------------------------------------------------------------------------
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.points_ledger enable row level security;

create policy "Users can view their own ledger entries"
  on public.points_ledger for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No insert/update/delete policies: ledger entries are written by trusted
-- server-side logic (service role) only, never directly by clients.
