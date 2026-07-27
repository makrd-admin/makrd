import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GLASS_INPUT, BTN_PRIMARY } from "@/lib/ui";
import { updateProfile } from "./actions";

export const metadata: Metadata = { title: "Profile · makrd" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { updated } = await searchParams;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, location, points_balance")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Profile</h1>

      {updated && (
        <p className="glass mb-4 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Profile updated.
        </p>
      )}

      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Signed in as {user.email} ·{" "}
        <span className="text-gradient font-medium">{profile.points_balance} pts</span>
      </p>

      <form action={updateProfile} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            name="display_name"
            required
            defaultValue={profile.display_name ?? ""}
            className={GLASS_INPUT}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Location (optional, e.g. Bengaluru)
          <input name="location" defaultValue={profile.location ?? ""} className={GLASS_INPUT} />
        </label>
        <button type="submit" className={BTN_PRIMARY}>
          Save
        </button>
      </form>
    </main>
  );
}
