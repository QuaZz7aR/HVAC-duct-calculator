import { uk as dict } from "@/lib/i18n/uk";
import type { FittingKind, FormRow } from "@/lib/form/fields";

/** Number in Ukrainian locale with a fixed count of decimals. */
export const fmt = (n: number, digits = 3) =>
  n.toLocaleString("uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "КВ — Круглий повітровод" */
export function kindTitle(kind: FittingKind) {
  const k = dict.kinds[kind];
  return `${k.designation} — ${k.name}`;
}

export const rowTitle = (row: FormRow) => kindTitle(row.kind);
