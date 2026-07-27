import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Register a printer
        </Link>
      </div>

      {created && (
        <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Printer registered — model ID <strong>{created}</strong>.
        </p>
      )}

      {printers.length === 0 ? (
        <p className="text-neutral-500">No printers yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {printers.map((printer) => (
            <li
              key={printer.id}
              className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {printer.make} {printer.model}
                </span>
                <span className="text-xs text-neutral-500">{printer.model_id}</span>
              </div>
              {printer.build_volume && (
                <p className="text-sm text-neutral-500">Build volume: {printer.build_volume}</p>
              )}
              {printer.materials.length > 0 && (
                <p className="text-sm text-neutral-500">
                  Materials: {printer.materials.join(", ")}
                </p>
              )}
              <p className="text-xs text-neutral-400">Status: {printer.status}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
