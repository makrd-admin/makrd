"use client";

import { useActionState, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import {
  MATERIALS,
  OTHER_MATERIAL,
  estimatePoints,
  estimateWeightGramsFromVolume,
} from "@/lib/points";
import { parseSTLVolumeCm3 } from "@/lib/stl-weight";
import { GLASS_INPUT } from "@/lib/ui";
import { createClient } from "@/lib/supabase/client";
import { submitJob, type SubmitJobState } from "../actions";

const initialState: SubmitJobState = { error: null };

export default function JobForm() {
  const [material, setMaterial] = useState<string>(MATERIALS[0].value);
  const [customMaterial, setCustomMaterial] = useState("");
  const [weightGrams, setWeightGrams] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(submitJob, initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTransitionPending, startTransition] = useTransition();

  // When the selected file is an STL, we parse its actual mesh volume and
  // estimate weight from it instead of asking for a guess — volumeCm3 holds
  // that parsed value so the estimate can be recomputed if the material
  // changes (different materials have different densities).
  const [volumeCm3, setVolumeCm3] = useState<number | null>(null);
  const [weightMode, setWeightMode] = useState<"auto" | "manual">("manual");

  const isOther = material === OTHER_MATERIAL;
  let estimate = 0;
  try {
    estimate = estimatePoints(material, weightGrams || 1, quantity || 1);
  } catch {
    estimate = 0;
  }
  const busy = isUploading || isPending || isTransitionPending;

  function recomputeAutoWeight(vol: number, mat: string) {
    setWeightGrams(estimateWeightGramsFromVolume(vol, mat));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".stl")) {
      setVolumeCm3(null);
      setWeightMode("manual");
      return;
    }

    const buffer = await file.arrayBuffer();
    const vol = parseSTLVolumeCm3(buffer);
    if (vol === null) {
      setVolumeCm3(null);
      setWeightMode("manual");
      return;
    }

    setVolumeCm3(vol);
    setWeightMode("auto");
    recomputeAutoWeight(vol, material);
  }

  function handleMaterialChange(value: string) {
    setMaterial(value);
    if (weightMode === "auto" && volumeCm3 !== null) {
      recomputeAutoWeight(volumeCm3, value);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("model_file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setUploadError("A model file is required");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsUploading(false);
      setUploadError("You must be signed in");
      return;
    }

    // Uploaded directly from the browser to Supabase Storage rather than
    // through a Server Action — Vercel's serverless functions cap request
    // bodies well below what a real model file needs, regardless of Next's
    // own body-size config. The job-files bucket's RLS policy scopes writes
    // to the uploader's own folder, same as before.
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("job-files").upload(path, file);
    setIsUploading(false);
    if (uploadErr) {
      setUploadError(uploadErr.message);
      return;
    }

    const fd = new FormData(form);
    // The raw File is still present in `form`'s FormData at this point —
    // strip it so the server action's payload stays tiny (just the storage
    // path), which is the whole point of uploading directly to Storage first.
    fd.delete("model_file");
    fd.set("model_file_path", path);
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
      <label className="flex flex-col gap-1 text-sm">
        Model file
        <input
          type="file"
          name="model_file"
          accept=".stl,.3mf,.step,.stp,.obj"
          onChange={handleFileChange}
          required
          className="text-sm"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          STL, 3MF, STEP, or OBJ. Weight is estimated automatically from STL files — other formats
          need a manual weight for now.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Material
        <select
          name="material"
          value={material}
          onChange={(e) => handleMaterialChange(e.target.value)}
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
        Weight per copy (grams)
        <input
          type="number"
          name="weight_grams"
          min={1}
          value={weightGrams}
          onChange={(e) => {
            setWeightMode("manual");
            setWeightGrams(Number(e.target.value));
          }}
          className={GLASS_INPUT}
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {weightMode === "auto"
            ? "Estimated from your STL file's geometry — edit it if this looks off."
            : "Enter the printed weight of one copy."}
        </span>
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
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        We&apos;ll try to match this with a free provider automatically — if no one&apos;s available
        right now, it&apos;ll be listed on the open jobs marketplace instead.
      </p>

      {(uploadError || state.error) && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
          {uploadError || state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-gradient rounded-full px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : busy ? "Submitting…" : "Submit job"}
      </button>
    </form>
  );
}
