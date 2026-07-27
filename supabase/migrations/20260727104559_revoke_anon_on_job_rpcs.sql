-- Supabase grants EXECUTE on new functions to anon/authenticated via default
-- privileges independent of the PUBLIC pseudo-role; these RPCs must only be
-- callable by signed-in (authenticated) users.
revoke execute on function public.accept_job(uuid) from anon;
revoke execute on function public.start_printing(uuid) from anon;
revoke execute on function public.mark_verification(uuid) from anon;
revoke execute on function public.complete_job(uuid) from anon;
revoke execute on function public.cancel_job(uuid) from anon;
