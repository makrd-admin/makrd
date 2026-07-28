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
