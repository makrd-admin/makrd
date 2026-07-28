"use client";

import { useActionState, useState } from "react";
import {
  MATERIALS,
  OTHER_MATERIAL,
  FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS,
  estimatePoints,
} from "@/lib/points";
import { GLASS_INPUT } from "@/lib/ui";
import { submitJob, type SubmitJobState } from "../actions";

const initialState: SubmitJobState = { error: null };

export default function JobForm() {
  const [material, setMaterial] = useState<string>(MATERIALS[0].value);
  const [customMaterial, setCustomMaterial] = useState("");
  const [weightGrams, setWeightGrams] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(submitJob, initialState);

  const isOther = material === OTHER_MATERIAL;
  let estimate = 0;
  try {
    estimate = estimatePoints(material, weightGrams || 1, quantity || 1);
  } catch {
    estimate = 0;
  }
  const qualifiesForFreePrint =
    weightGrams * (quantity || 1) <= FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS;

  return (
    <form action={formAction} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
      {qualifiesForFreePrint && (
        <p className="glass rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          🎁 Your first print is free, up to {FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS}g total — this one
          qualifies if it&apos;s your first job.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Model file
        <input
          type="file"
          name="model_file"
          accept=".stl,.3mf,.step,.stp,.obj"
          required
          className="text-sm"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          STL, 3MF, STEP, or OBJ.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Material
        <select
          name="material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className={GLASS_INPUT}
        >
          {MATERIALS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={OTHER_MATERIAL}>Other (specify)</option>
        </select>
      </label>

      {isOther && (
        <label className="flex flex-col gap-1 text-sm">
          Custom filament
          <input
            type="text"
            name="custom_material"
            value={customMaterial}
            onChange={(e) => setCustomMaterial(e.target.value)}
            placeholder="e.g. Nylon, Carbon-fiber PLA"
            required
            className={GLASS_INPUT}
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Weight (grams, total for all copies)
        <input
          type="number"
          name="weight_grams"
          min={1}
          value={weightGrams}
          onChange={(e) => setWeightGrams(Number(e.target.value))}
          className={GLASS_INPUT}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Quantity
        <input
          type="number"
          name="quantity"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={GLASS_INPUT}
        />
      </label>

      <p className="glass rounded-xl px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
        Estimated cost:{" "}
        <strong className="text-gradient">
          {qualifiesForFreePrint ? "Free (if first job)" : `${estimate} pts`}
        </strong>
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        We&apos;ll try to match this with a free provider automatically — if no one&apos;s available
        right now, it&apos;ll be listed on the open jobs marketplace instead.
      </p>

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
        {isPending ? "Submitting…" : "Submit job"}
      </button>
    </form>
  );
}
