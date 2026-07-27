"use client";

import { useState } from "react";
import { MATERIALS } from "@/lib/points";
import { submitJob } from "../actions";

const inputClass =
  "rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";

export default function JobForm() {
  const [material, setMaterial] = useState<string>(MATERIALS[0].value);
  const [quantity, setQuantity] = useState(1);

  const rate = MATERIALS.find((m) => m.value === material)?.pointsPerUnit ?? 0;
  const estimate = rate * Math.max(1, quantity || 1);

  return (
    <form action={submitJob} className="flex flex-col gap-4">
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
          className={inputClass}
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
          className={inputClass}
        />
      </label>
      <p className="text-sm text-neutral-500">
        Estimated cost: <strong>{estimate} pts</strong>
      </p>
      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Submit job
      </button>
    </form>
  );
}
