-- 25-point signup bonus for every new user, with a ledger entry for audit.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, points_balance)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 25);

  insert into public.points_ledger (user_id, delta, reason)
  values (new.id, 25, 'signup_bonus');

  return new;
end;
$$;

-- Jobs now carry a weight, which pricing scales with. Default is only a
-- migration-safety fallback — the app always supplies a real value.
alter table public.jobs
  add column weight_grams integer not null default 10 check (weight_grams > 0);

-- Pricing: points scale with weight (and quantity), not a flat per-unit rate.
-- Custom/"Other" materials (free text, not in the known list) fall back to a
-- default rate rather than being rejected. A requester's first-ever job is
-- free if its total weight is 10g or under (promo, not a fraud vector: a
-- fresh account still needs signup-bonus points or a real payment for
-- anything bigger, and this only ever fires once per requester_id).
create or replace function public.set_job_points()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rate numeric;
  is_first_job boolean;
begin
  rate := case new.material
    when 'PLA' then 0.5
    when 'PETG' then 0.7
    when 'ABS' then 0.7
    when 'TPU' then 1.0
    when 'Resin' then 1.5
    else 0.7 -- custom/"Other" materials
  end;

  if new.quantity is null or new.quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  if new.weight_grams is null or new.weight_grams < 1 then
    raise exception 'Weight must be at least 1 gram';
  end if;

  new.est_points := greatest(1, round(rate * new.weight_grams * new.quantity)::integer);
  new.provider_id := null;
  new.status := 'submitted';

  select not exists (
    select 1 from public.jobs where requester_id = new.requester_id
  ) into is_first_job;

  if is_first_job and (new.weight_grams * new.quantity) <= 10 then
    new.est_points := 0;
  end if;

  return new;
end;
$$;
