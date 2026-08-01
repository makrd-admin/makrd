-- The onboarding tour was gated purely via localStorage, which doesn't
-- survive private browsing, cleared site data, or switching devices — all of
-- which read as "the tour keeps coming back" even though the client-side
-- logic was already correct. Move the "seen it" flag server-side so it's
-- durable per account. Not a fraud-sensitive column (unlike points_balance/
-- is_admin) — a user marking their own tour as seen is harmless, so the
-- existing owner-scoped profiles UPDATE policy already covers writing it.
alter table public.profiles
  add column has_seen_tour boolean not null default false;
