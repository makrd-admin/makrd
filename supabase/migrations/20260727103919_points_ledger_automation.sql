-- Enforce that a requester has enough points before a job can be submitted.
create function public.check_requester_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  balance integer;
begin
  select points_balance into balance from public.profiles where id = new.requester_id;
  if balance is null or balance < new.est_points then
    raise exception 'Insufficient points balance to submit this job';
  end if;
  return new;
end;
$$;

create trigger check_requester_balance_before_job_insert
  before insert on public.jobs
  for each row execute function public.check_requester_balance();

-- On job completion, atomically debit the requester and credit the provider.
-- security definer: normal users can't update another user's profile or
-- insert points_ledger rows directly (no client-facing policies for that).
create function public.handle_job_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    if new.provider_id is null then
      raise exception 'Cannot complete a job with no assigned provider';
    end if;

    insert into public.points_ledger (user_id, job_id, delta, reason)
    values
      (new.requester_id, new.id, -new.est_points, 'job_payment'),
      (new.provider_id, new.id, new.est_points, 'job_earning');

    update public.profiles
      set points_balance = points_balance - new.est_points, updated_at = now()
      where id = new.requester_id;

    update public.profiles
      set points_balance = points_balance + new.est_points, updated_at = now()
      where id = new.provider_id;
  end if;
  return new;
end;
$$;

create trigger handle_job_completed_after_job_update
  after update on public.jobs
  for each row execute function public.handle_job_completed();

revoke execute on function public.handle_job_completed() from public, anon, authenticated;
revoke execute on function public.check_requester_balance() from public, anon, authenticated;
