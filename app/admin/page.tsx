import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · maKrd" };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: views, error } = await supabase
    .from("page_views")
    .select("id, path, created_at, user:profiles(username, display_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  // Most-recent visit per member, derived client-side from the same feed —
  // simple at this scale, no separate query needed.
  const lastSeen = new Map<string, { name: string; at: string }>();
  for (const v of views ?? []) {
    const name = v.user?.username ?? v.user?.display_name ?? "A maKr";
    if (!lastSeen.has(name)) {
      lastSeen.set(name, { name, at: v.created_at });
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-6 sm:p-10">
      <h1 className="mb-2 text-xl font-semibold">Admin</h1>
      <p className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
        Who&apos;s been on the site, and when. Only visible to admins.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Members seen recently</h2>
        {lastSeen.size === 0 ? (
          <p className="glass rounded-2xl p-6 text-center text-neutral-500 dark:text-neutral-400">
            No visits logged yet.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...lastSeen.values()].map((m) => (
              <li
                key={m.name}
                className="glass flex items-center justify-between rounded-xl px-4 py-3"
              >
                <span className="font-medium">{m.name}</span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(m.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--glass-border)] text-xs text-neutral-500 uppercase dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {(views ?? []).map((v) => (
                <tr key={v.id} className="border-b border-[var(--glass-border)] last:border-0">
                  <td className="px-4 py-2.5">
                    {v.user?.username ?? v.user?.display_name ?? "A maKr"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">{v.path}</td>
                  <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400">
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
