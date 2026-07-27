-- ---------------------------------------------------------------------------
-- jobs: server-authoritative pricing (never trust client-supplied est_points)
-- ---------------------------------------------------------------------------
drop trigger check_requester_balance_before_job_insert on public.jobs;

create function public.set_job_points()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rate integer;
begin
  rate := case new.material
    when 'PLA' then 5
    when 'PETG' then 7
    when 'ABS' then 7
    when 'TPU' then 10
    when 'Resin' then 15
    else null
  end;

  if rate is null then
    raise exception 'Unsupported material: %', new.material;
  end if;

  if new.quantity is null or new.quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  new.est_points := rate * new.quantity;
  return new;
end;
$$;

-- Trigger names are prefixed a_/b_ so pricing is finalized (a_) before the
-- balance check (b_) reads est_points — same-timing triggers fire in name order.
create trigger a_set_job_points_before_job_insert
  before insert on public.jobs
  for each row execute function public.set_job_points();

create trigger b_check_requester_balance_before_job_insert
  before insert on public.jobs
  for each row execute function public.check_requester_balance();

-- ---------------------------------------------------------------------------
-- jobs: replace the broad, exploitable UPDATE policy with narrow RPCs.
-- The old policy's WITH CHECK only constrained requester_id/provider_id,
-- letting either party rewrite est_points/material/model_file at any time.
-- ---------------------------------------------------------------------------
drop policy "Requesters and providers can update their own jobs" on public.jobs;

create function public.accept_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set provider_id = (select auth.uid()), status = 'accepted', updated_at = now()
    where id = p_job_id and status = 'submitted';

  if not found then
    raise exception 'Job is no longer open';
  end if;
end;
$$;

create function public.start_printing(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set status = 'printing', updated_at = now()
    where id = p_job_id and status = 'accepted' and provider_id = (select auth.uid());

  if not found then
    raise exception 'Job cannot be moved to printing';
  end if;
end;
$$;

create function public.mark_verification(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set status = 'verification', updated_at = now()
    where id = p_job_id and status = 'printing' and provider_id = (select auth.uid());

  if not found then
    raise exception 'Job cannot be moved to verification';
  end if;
end;
$$;

create function public.complete_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set status = 'completed', updated_at = now()
    where id = p_job_id and status = 'verification' and requester_id = (select auth.uid());

  if not found then
    raise exception 'Job cannot be marked completed';
  end if;
end;
$$;

create function public.cancel_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set status = 'cancelled', updated_at = now()
    where id = p_job_id and status = 'submitted' and requester_id = (select auth.uid());

  if not found then
    raise exception 'Job cannot be cancelled';
  end if;
end;
$$;

revoke execute on function public.accept_job(uuid) from public;
revoke execute on function public.start_printing(uuid) from public;
revoke execute on function public.mark_verification(uuid) from public;
revoke execute on function public.complete_job(uuid) from public;
revoke execute on function public.cancel_job(uuid) from public;
grant execute on function public.accept_job(uuid) to authenticated;
grant execute on function public.start_printing(uuid) to authenticated;
grant execute on function public.mark_verification(uuid) to authenticated;
grant execute on function public.complete_job(uuid) to authenticated;
grant execute on function public.cancel_job(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: points_balance must only ever change via the trusted
-- handle_job_completed trigger, never directly through the client API.
-- ---------------------------------------------------------------------------
create function public.protect_points_balance()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.points_balance is distinct from old.points_balance and current_user = 'authenticated' then
    raise exception 'points_balance cannot be modified directly';
  end if;
  return new;
end;
$$;

create trigger protect_points_balance_before_profile_update
  before update on public.profiles
  for each row execute function public.protect_points_balance();
