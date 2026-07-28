"use client";

import { useActionState, useState } from "react";
import { MATERIALS } from "@/lib/points";
import { PRINTER_MODELS } from "@/lib/printer-models";
import { GLASS_INPUT } from "@/lib/ui";
import { createPrinter, type CreatePrinterState } from "../actions";

const initialState: CreatePrinterState = { error: null };

export default function PrinterForm() {
  const [state, formAction, isPending] = useActionState(createPrinter, initialState);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [buildVolume, setBuildVolume] = useState("");
  const [showCustomFilament, setShowCustomFilament] = useState(false);

  function handleCatalogPick(index: string) {
    if (index === "") return;
    const printer = PRINTER_MODELS[Number(index)];
    if (!printer) return;
    setMake(printer.make);
    setModel(printer.model);
    setBuildVolume(printer.buildVolume);
  }

  return (
    <form action={formAction} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
      <label className="flex flex-col gap-1 text-sm">
        Choose from common printers (optional)
        <select
          defaultValue=""
          onChange={(e) => handleCatalogPick(e.target.value)}
          className={GLASS_INPUT}
        >
          <option value="">— Not listed / fill in manually —</option>
          {PRINTER_MODELS.map((p, i) => (
            <option key={`${p.make}-${p.model}`} value={i}>
              {p.make} {p.model}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Fills in make, model, and build volume below — everything stays editable.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Make
        <input
          name="make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          required
          className={GLASS_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Model
        <input
          name="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          className={GLASS_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Build volume (optional, e.g. 220x220x250mm)
        <input
          name="build_volume"
          value={buildVolume}
          onChange={(e) => setBuildVolume(e.target.value)}
          className={GLASS_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Location (optional, e.g. Koramangala, Bengaluru)
        <input name="location" className={GLASS_INPUT} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Helps nearby members find you — this is a P2P network, proximity matters.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description (optional)
        <textarea
          name="description"
          rows={3}
          className={GLASS_INPUT}
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCustomFilament}
            onChange={(e) => setShowCustomFilament(e.target.checked)}
          />
          Other (specify)
        </label>
        {showCustomFilament && (
          <input
            type="text"
            name="custom_material"
            placeholder="e.g. Nylon, Carbon-fiber PLA"
            className={GLASS_INPUT}
          />
        )}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        Secret code word
        <input name="code_word" type="password" required minLength={6} className={GLASS_INPUT} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Proves you&apos;re really operating this printer. We only store a hash of this — remember
          it yourself, it can&apos;t be recovered.
        </span>
      </label>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-gradient rounded-full px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Registering…" : "Register printer"}
      </button>
    </form>
  );
}
