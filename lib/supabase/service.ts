import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client — bypasses RLS entirely. Server-only, and
 * only for contexts with no user session to authenticate a request (e.g.
 * the Razorpay webhook, which Razorpay calls directly, verified by HMAC
 * signature rather than a user JWT). Never use this for anything a normal
 * user-scoped request could handle instead.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
