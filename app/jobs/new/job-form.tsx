"use client";

import { useActionState, useState } from "react";
import { MATERIALS } from "@/lib/points";
import { GLASS_INPUT } from "@/lib/ui";
import { submitJob, type SubmitJobState } from "../actions";

const initialState: SubmitJobState = { error: null };

export default function JobForm() {
  const [material, setMaterial] = useState<string>(MATERIALS[0].value);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(submitJob, initialState);

  const rate = MATERIALS.find((m) => m.value === material)?.pointsPerUnit ?? 0;
  const estimate = rate * Math.max(1, quantity || 1);

  return (
    <form action={formAction} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
      <label className="flex flex-col gap-1 text-sm">
        Model file
        <input type="file" name="model_file" required className="text-sm" />
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
        </select>
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
        Estimated cost: <strong className="text-gradient">{estimate} pts</strong>
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
