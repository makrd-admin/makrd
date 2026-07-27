import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
  await requireUser();
  const supabase = await createClient();

  // Never select code_word_hash here — this is a public-to-members directory,
  // not the owner-only /printers view.
  const { data: printers, error } = await supabase
    .from("printers")
    .select(
      "id, make, model, build_volume, location, description, materials, status, created_at, owner:profiles(display_name)",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-xl font-semibold">Community printers</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Every printer registered on the network. Submit a job and one of these members can pick it
        up.
      </p>

      {printers.length === 0 ? (
        <p className="text-neutral-500">No printers registered yet — be the first.</p>
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
                <span className="text-xs text-neutral-500">
                  {printer.owner?.display_name ?? "A makrd member"}
                </span>
              </div>
              {printer.location && <p className="text-sm text-neutral-500">{printer.location}</p>}
              {printer.materials.length > 0 && (
                <p className="text-sm text-neutral-500">
                  Materials: {printer.materials.join(", ")}
                </p>
              )}
              {printer.description && (
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {printer.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
