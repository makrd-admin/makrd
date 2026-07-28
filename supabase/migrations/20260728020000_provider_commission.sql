-- Provider commission: the provider who completes a job keeps a share of
-- the requester's payment rather than the full amount. The requester still
-- pays the full est_points (unchanged); the remainder isn't routed anywhere
-- yet (no platform account exists to hold it) — a simple starting split,
-- easy to retune later. Keep PROVIDER_COMMISSION_RATE in lib/points.ts in
-- sync with the rate below if it changes; that constant only drives the
-- client-side "you'd earn ~X pts" display, this is what actually credits
-- points on completion.
create or replace function public.handle_job_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_commission integer;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    if new.provider_id is null then
      raise exception 'Cannot complete a job with no assigned provider';
    end if;

    v_commission := greatest(0, round(new.est_points * 0.9)::integer);

    insert into public.points_ledger (user_id, job_id, delta, reason)
    values
      (new.requester_id, new.id, -new.est_points, 'job_payment'),
      (new.provider_id, new.id, v_commission, 'job_earning');

    update public.profiles
      set points_balance = points_balance - new.est_points, updated_at = now()
      where id = new.requester_id;

    update public.profiles
      set points_balance = points_balance + v_commission, updated_at = now()
      where id = new.provider_id;
  end if;
  return new;
end;
$$;
