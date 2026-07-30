import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages · maKrd" };

export default async function MessagesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profiles }, { data: recent }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name").neq("id", user.id),
    supabase
      .from("direct_messages")
      .select("sender_id, recipient_id, content, created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Latest message per counterpart — messages come back newest-first, so
  // the first one seen for a given counterpart is the most recent.
  const latestByCounterpart = new Map<string, { content: string; created_at: string }>();
  for (const m of recent ?? []) {
    const counterpart = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!latestByCounterpart.has(counterpart)) {
      latestByCounterpart.set(counterpart, { content: m.content, created_at: m.created_at });
    }
  }

  const people = (profiles ?? [])
    .map((p) => ({ ...p, latest: latestByCounterpart.get(p.id) ?? null }))
    .sort((a, b) => {
      if (a.latest && b.latest) {
        return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime();
      }
      if (a.latest) return -1;
      if (b.latest) return 1;
      return (a.username ?? a.display_name ?? "").localeCompare(b.username ?? b.display_name ?? "");
    });

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <h1 className="mb-2 text-xl font-semibold">Messages</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Direct messages with other maKrs on the network.
      </p>

      {people.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-center text-neutral-500 dark:text-neutral-400">
          No other maKrs on the network yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link
                href={`/messages/${p.id}`}
                className="glass flex items-center justify-between rounded-2xl p-4 transition-transform hover:scale-[1.01]"
              >
                <div className="min-w-0">
                  <p className="font-medium">{p.username ?? p.display_name ?? "A maKr"}</p>
                  {p.latest && (
                    <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {p.latest.content}
                    </p>
                  )}
                </div>
                {p.latest && (
                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                    {new Date(p.latest.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
