export const MATERIALS = [
  { value: "PLA", label: "PLA", pointsPerGram: 0.5 },
  { value: "PETG", label: "PETG", pointsPerGram: 0.7 },
  { value: "ABS", label: "ABS", pointsPerGram: 0.7 },
  { value: "TPU", label: "TPU", pointsPerGram: 1.0 },
  { value: "Resin", label: "Resin", pointsPerGram: 1.5 },
] as const;

export const OTHER_MATERIAL = "Other";
const DEFAULT_RATE = 0.7; // custom/"Other" materials not in the list above

export type MaterialValue = (typeof MATERIALS)[number]["value"] | typeof OTHER_MATERIAL;

export const FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS = 10;

/**
 * Display-only estimate — the database recomputes and enforces the real
 * price server-side (see set_job_points), including the first-print-free
 * promo, so this can't be tampered with in transit. Mirrors the SQL rates;
 * keep both in sync manually if pricing changes.
 */
export function estimatePoints(material: string, weightGrams: number, quantity: number): number {
  if (!Number.isFinite(weightGrams) || weightGrams < 1) {
    throw new Error("Invalid weight");
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Invalid quantity");
  }
  const rate = MATERIALS.find((m) => m.value === material)?.pointsPerGram ?? DEFAULT_RATE;
  return Math.max(1, Math.round(rate * weightGrams * Math.floor(quantity)));
}

const MATERIAL_DENSITY_G_CM3: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.21,
  Resin: 1.15,
};
const DEFAULT_DENSITY_G_CM3 = 1.2; // custom/"Other" materials

/**
 * Real FDM prints are rarely solid — this assumes a typical hobbyist
 * infill level so a parsed model's solid volume turns into a plausible
 * printed weight, not a "printed at 100% infill" number. Rough by design;
 * one constant to tune later once real prints give us better data.
 */
export const ASSUMED_INFILL_FACTOR = 0.2;

/** Weight of one printed copy, estimated from its parsed mesh volume. */
export function estimateWeightGramsFromVolume(volumeCm3: number, material: string): number {
  const density = MATERIAL_DENSITY_G_CM3[material] ?? DEFAULT_DENSITY_G_CM3;
  return Math.max(1, Math.round(volumeCm3 * density * ASSUMED_INFILL_FACTOR));
}

/**
 * Share of a completed job's points the provider keeps. The remainder isn't
 * routed anywhere yet (no platform account exists to hold it) — this is a
 * starting proportion, easy to tune in one place later; mirror any change
 * in the handle_job_completed SQL trigger, which is what actually credits
 * points on completion.
 */
export const PROVIDER_COMMISSION_RATE = 0.9;

export function estimateCommission(estPoints: number): number {
  return Math.max(0, Math.round(estPoints * PROVIDER_COMMISSION_RATE));
}
