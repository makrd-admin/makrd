/**
 * Points packages — display/UX only. The actual pricing that gets charged
 * and credited lives in the create_points_purchase Postgres function
 * (supabase/migrations/20260728000000_add_points_purchases.sql), which
 * re-derives points/amount from packageId server-side and never trusts a
 * client-supplied value. Keep these two in sync manually if pricing changes.
 *
 * Placeholder rate (₹1 = 1 point) — a real business decision, adjust freely.
 */
export const POINTS_PACKAGES = [
  { packageId: 0, points: 100, amountInr: 100 },
  { packageId: 1, points: 500, amountInr: 500 },
  { packageId: 2, points: 1000, amountInr: 1000 },
] as const;
