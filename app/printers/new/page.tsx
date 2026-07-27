import { requireUser } from "@/lib/auth";
import { MATERIALS } from "@/lib/points";
import { createPrinter } from "../actions";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";

export default async function NewPrinterPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-6 text-xl font-semibold">Register a printer</h1>
      <form action={createPrinter} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Make
          <input name="make" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Model
          <input name="model" required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Build volume (optional, e.g. 220x220x250mm)
          <input name="build_volume" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Location (optional, e.g. Koramangala, Bengaluru)
          <input name="location" className={inputClass} />
          <span className="text-xs text-neutral-500">
            Helps nearby members find you — this is a P2P network, proximity matters.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description (optional)
          <textarea
            name="description"
            rows={3}
            className={inputClass}
            placeholder="e.g. well-maintained, prints daily, good for detailed miniatures"
          />
        </label>
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">Materials supported</legend>
          {MATERIALS.map((m) => (
            <label key={m.value} className="flex items-center gap-2">
              <input type="checkbox" name="materials" value={m.value} />
              {m.label}
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1 text-sm">
          Secret code word
          <input name="code_word" type="password" required minLength={6} className={inputClass} />
          <span className="text-xs text-neutral-500">
            Proves you&apos;re really operating this printer. We only store a hash of this —
            remember it yourself, it can&apos;t be recovered.
          </span>
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Register printer
        </button>
      </form>
    </main>
  );
}
