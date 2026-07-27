import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export const metadata: Metadata = { title: "Profile · makrd" };

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";

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
        <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Profile updated.
        </p>
      )}

      <p className="mb-6 text-sm text-neutral-500">
        Signed in as {user.email} · {profile.points_balance} pts
      </p>

      <form action={updateProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Display name
          <input
            name="display_name"
            required
            defaultValue={profile.display_name ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Location (optional, e.g. Bengaluru)
          <input name="location" defaultValue={profile.location ?? ""} className={inputClass} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Save
        </button>
      </form>
    </main>
  );
}
