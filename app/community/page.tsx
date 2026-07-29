import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CommunityChat from "./community-chat";

export const metadata: Metadata = { title: "Community · maKrd" };

export default async function CommunityPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Never select code_word_hash here — this is a public-to-members directory,
  // not the owner-only /printers view.
  const { data: printers, error } = await supabase
    .from("printers")
    .select(
      "id, make, model, build_volume, location, description, materials, status, created_at, owner_id, owner:profiles(display_name)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 sm:p-10">
      <h1 className="mb-2 text-xl font-semibold">Community maKrs</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Every printer registered on the network. Submit a job and one of these maKrs can pick it up.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {printers.length === 0 ? (
            <p className="glass rounded-2xl p-6 text-center text-neutral-500 dark:text-neutral-400">
              No printers registered yet — be the first.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {printers.map((printer) => (
                <li key={printer.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {printer.make} {printer.model}
                    </span>
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                      {printer.owner?.display_name ?? "A maKr"}
                    </span>
                  </div>
                  {printer.location && (
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {printer.location}
                    </p>
                  )}
                  {printer.materials.length > 0 && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Materials: {printer.materials.join(", ")}
                    </p>
                  )}
                  {printer.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {printer.description}
                    </p>
                  )}
                  {printer.owner_id !== user.id && (
                    <Link
                      href={`/messages/${printer.owner_id}`}
                      className="mt-2 inline-block text-sm font-medium underline underline-offset-2"
                    >
                      Message {printer.owner?.display_name ?? "this maKr"}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <CommunityChat />
      </div>
    </main>
  );
}
