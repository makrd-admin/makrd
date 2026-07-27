export const MATERIALS = [
  { value: "PLA", label: "PLA", pointsPerUnit: 5 },
  { value: "PETG", label: "PETG", pointsPerUnit: 7 },
  { value: "ABS", label: "ABS", pointsPerUnit: 7 },
  { value: "TPU", label: "TPU", pointsPerUnit: 10 },
  { value: "Resin", label: "Resin", pointsPerUnit: 15 },
] as const;

export type MaterialValue = (typeof MATERIALS)[number]["value"];

/**
 * Placeholder pricing: material rate * quantity. Good enough to unblock the
 * core loop end-to-end; refine once real print-time/cost data exists.
 */
export function estimatePoints(material: string, quantity: number): number {
  const rate = MATERIALS.find((m) => m.value === material)?.pointsPerUnit;
  if (!rate || !Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Invalid material or quantity");
  }
  return rate * Math.floor(quantity);
}
