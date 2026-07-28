-- Harden jobs INSERT: the client-facing policy only checks requester_id, so a
-- malicious client could previously insert a job pre-marked as 'accepted' with
-- provider_id set to any user. Force both to their true starting values,
-- same server-authoritative pattern as set_job_points for est_points.
create or replace function public.set_job_points()
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
  new.provider_id := null;
  new.status := 'submitted';
  return new;
end;
$$;

-- Auto-match a newly submitted job to a "free" provider: an active printer,
-- supporting the job's material, whose owner has no other job currently in
-- accepted/printing/verification. Falls back to leaving the job open for
-- manual browse-and-accept (existing flow) if no one qualifies. Runs after
-- a_set_job_points/b_check_requester_balance so it sees the final row.
create function public.auto_assign_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_owner uuid;
begin
  select p.owner_id into candidate_owner
  from public.printers p
  where p.status = 'active'
    and new.material = any (p.materials)
    and p.owner_id <> new.requester_id
    and not exists (
      select 1 from public.jobs j
      where j.provider_id = p.owner_id
        and j.status in ('accepted', 'printing', 'verification')
    )
  order by p.created_at asc
  limit 1;

  if candidate_owner is not null then
    update public.jobs
      set provider_id = candidate_owner, status = 'accepted', updated_at = now()
      where id = new.id;
  end if;

  return new;
end;
$$;

create trigger auto_assign_job_after_job_insert
  after insert on public.jobs
  for each row execute function public.auto_assign_job();
