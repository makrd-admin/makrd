import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setPrinterStatus } from "./actions";

export const metadata: Metadata = { title: "My Printers · makrd" };

export default async function PrintersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { created } = await searchParams;

  const { data: printers, error } = await supabase
    .from("printers")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My printers</h1>
        <Link
          href="/printers/new"
          className="btn-gradient rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Register a printer
        </Link>
      </div>

      {created && (
        <p className="glass mb-4 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Printer registered — model ID <strong>{created}</strong>.
        </p>
      )}

      {printers.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-center text-neutral-500 dark:text-neutral-400">
          No printers yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {printers.map((printer) => (
            <li key={printer.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {printer.make} {printer.model}
                </span>
                <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                  {printer.model_id}
                </span>
              </div>
              {printer.location && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Location: {printer.location}
                </p>
              )}
              {printer.build_volume && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Build volume: {printer.build_volume}
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
              <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Status: {printer.status}
                </p>
                <form
                  action={setPrinterStatus.bind(
                    null,
                    printer.id,
                    printer.status === "active" ? "inactive" : "active",
                  )}
                >
                  <button
                    type="submit"
                    className="text-xs font-medium underline underline-offset-2 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    {printer.status === "active" ? "Pause" : "Reactivate"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
