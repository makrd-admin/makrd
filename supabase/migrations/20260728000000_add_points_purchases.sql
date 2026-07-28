-- Track Razorpay-backed points purchases (buy points with real money).
create table public.points_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount_paise integer not null,
  points integer not null,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.points_purchases enable row level security;

create policy "Users can view their own purchases"
  on public.points_purchases for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No client-facing insert/update/delete policies: rows are only ever created
-- by create_points_purchase (below) and only ever transition to 'paid' via
-- the Razorpay webhook using the service role key. This is deliberately
-- stricter than the jobs table's RPC pattern, since real money is involved.

-- Re-derives points/amount server-side from a fixed package list — never
-- trusts a client-supplied points or amount value, same discipline as
-- set_job_points. package_id is just an index; the actual pricing lives
-- here, not in the client.
create function public.create_points_purchase(p_package_id smallint, p_razorpay_order_id text)
returns public.points_purchases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_points integer;
  v_amount_paise integer;
  v_row public.points_purchases;
begin
  case p_package_id
    when 0 then v_points := 100;  v_amount_paise := 10000;   -- ₹100
    when 1 then v_points := 500;  v_amount_paise := 50000;   -- ₹500
    when 2 then v_points := 1000; v_amount_paise := 100000;  -- ₹1000
    else raise exception 'Unknown package_id: %', p_package_id;
  end case;

  insert into public.points_purchases (user_id, razorpay_order_id, amount_paise, points)
    values ((select auth.uid()), p_razorpay_order_id, v_amount_paise, v_points)
    returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.create_points_purchase(smallint, text) from public;
grant execute on function public.create_points_purchase(smallint, text) to authenticated;
revoke execute on function public.create_points_purchase(smallint, text) from anon;

-- Idempotent: only acts if the purchase is still 'created' (handles Razorpay
-- webhook retries safely). Only ever called via the service-role client from
-- the webhook route, after HMAC signature verification — never grant this to
-- anon/authenticated, since nothing here re-verifies payment itself.
create function public.complete_points_purchase(p_order_id text, p_payment_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_purchase public.points_purchases;
begin
  select * into v_purchase from public.points_purchases
    where razorpay_order_id = p_order_id and status = 'created'
    for update;

  if not found then
    return;
  end if;

  update public.points_purchases
    set status = 'paid', razorpay_payment_id = p_payment_id, updated_at = now()
    where id = v_purchase.id;

  update public.profiles
    set points_balance = points_balance + v_purchase.points, updated_at = now()
    where id = v_purchase.user_id;

  insert into public.points_ledger (user_id, delta, reason)
    values (v_purchase.user_id, v_purchase.points, 'points_purchase');
end;
$$;

revoke execute on function public.complete_points_purchase(text, text) from public, anon, authenticated;
