-- handle_new_user is a trigger function only; it should never be callable
-- directly via the REST RPC endpoint by anon/authenticated roles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
