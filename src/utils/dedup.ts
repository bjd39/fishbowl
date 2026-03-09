import type { Slip } from '../types';

export function findDuplicates(slips: Slip[]): { unique: Slip[]; removedCount: number } {
  const seen = new Map<string, Slip>();
  let removedCount = 0;

  for (const slip of slips) {
    const key = slip.text.trim().toLowerCase();
    if (seen.has(key)) {
      removedCount++;
    } else {
      seen.set(key, slip);
    }
  }

  return { unique: Array.from(seen.values()), removedCount };
}
