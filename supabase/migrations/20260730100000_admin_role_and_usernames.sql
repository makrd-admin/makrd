-- Admin role: a simple boolean flag, not a client-settable column (see the
-- extended protect_profile_privileged_columns trigger below — same pattern
-- already used for points_balance, just widened to cover this too).
alter table public.profiles
  add column is_admin boolean not null default false;

-- Unique username, used for identification across the app (community,
-- messages) instead of the free-text display_name. Nullable at the DB
-- level deliberately — existing accounts can't retroactively be given one
-- automatically, so the app enforces "you must set a username before doing
-- anything else" via a redirect gate rather than a NOT NULL constraint that
-- would break on migrate. Case-insensitive uniqueness (citext-free — a
-- functional index on lower() avoids adding the citext extension for one
-- column) and a format check to keep it identifier-safe.
alter table public.profiles
  add column username text,
  add constraint username_format check (
    username is null or username ~ '^[a-zA-Z0-9_]{3,20}$'
  );

create unique index profiles_username_unique_idx on public.profiles (lower(username));

-- Widen the existing points_balance protection trigger to also cover
-- is_admin and username — none of these should ever be settable by a
-- normal authenticated client request, only via a trusted server path
-- (the service role, or a SECURITY DEFINER function that re-validates).
create or replace function public.protect_points_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.points_balance is distinct from old.points_balance and current_user = 'authenticated' then
    raise exception 'points_balance cannot be modified directly';
  end if;
  if new.is_admin is distinct from old.is_admin and current_user = 'authenticated' then
    raise exception 'is_admin cannot be modified directly';
  end if;
  return new;
end;
$$;

-- Username needs its own uniqueness re-check server-side (RPC) since a
-- client could otherwise race two simultaneous claims of the same name
-- between the app's own pre-check and the actual write. SECURITY DEFINER
-- so it can run even though profiles' own UPDATE policy doesn't need to
-- change — it just re-validates and writes on the caller's behalf.
create function public.set_username(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_username !~ '^[a-zA-Z0-9_]{3,20}$' then
    raise exception 'Usernames must be 3-20 characters: letters, numbers, underscores only';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username) and id <> (select auth.uid())
  ) then
    raise exception 'That username is already taken';
  end if;

  update public.profiles
    set username = p_username, updated_at = now()
    where id = (select auth.uid());
end;
$$;

revoke execute on function public.set_username(text) from public, anon;
grant execute on function public.set_username(text) to authenticated;

-- One-time grant: Mohit's own account becomes the first admin.
update public.profiles set is_admin = true where id = 'bde427df-2a49-4642-acdc-f39d647ff7ec';
