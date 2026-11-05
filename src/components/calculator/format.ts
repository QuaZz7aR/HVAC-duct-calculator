import { uk, type Dictionary } from "@/lib/i18n/uk";
import type { FittingKind, FormRow } from "@/lib/form/fields";

/** Number in Ukrainian locale with a fixed count of decimals. */
export const fmt = (n: number, digits = 3) =>
  n.toLocaleString("uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "КПв — Круглий повітропровід" */
export function kindTitle(kind: FittingKind, dict: Dictionary = uk) {
  const k = dict.kinds[kind];
  return `${k.designation} — ${k.name}`;
}

export const rowTitle = (row: FormRow, dict: Dictionary = uk) => kindTitle(row.kind, dict);
