-- Lets a provider back out of a job they accepted but haven't started printing yet,
-- returning it to the open marketplace instead of leaving it permanently stuck.
create function public.release_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.jobs
    set provider_id = null, status = 'submitted', updated_at = now()
    where id = p_job_id and status = 'accepted' and provider_id = (select auth.uid());

  if not found then
    raise exception 'Job cannot be released';
  end if;
end;
$$;

revoke execute on function public.release_job(uuid) from public;
revoke execute on function public.release_job(uuid) from anon;
grant execute on function public.release_job(uuid) to authenticated;
