-- Every valid job must cost at least some points — remove the first-print-
-- free promo (est_points := 0 was contradicting "anything above 0g needs a
-- certain amount of points as reward"). Weight must stay strictly positive;
-- the existing greatest(1, ...) floor already guarantees a minimum charge.
create or replace function public.set_job_points()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  rate numeric;
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
    raise exception 'Weight must be greater than 0 grams';
  end if;

  new.est_points := greatest(1, round(rate * new.weight_grams * new.quantity)::integer);
  new.provider_id := null;
  new.status := 'submitted';

  return new;
end;
$$;
