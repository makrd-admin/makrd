-- auto_assign_job is a trigger function only (operates on NEW from trigger
-- context); it must never be callable directly via the REST RPC endpoint.
revoke execute on function public.auto_assign_job() from public, anon, authenticated;
