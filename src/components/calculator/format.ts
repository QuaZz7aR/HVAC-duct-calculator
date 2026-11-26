import { uk, type Dictionary } from "@/lib/i18n/uk";
import { kindFields, type FieldKey, type FittingKind, type FormRow } from "@/lib/form/fields";

/** Number in Ukrainian locale with a fixed count of decimals. */
export const fmt = (n: number, digits = 3) =>
  n.toLocaleString("uk-UA", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "КПв — Круглий повітропровід" */
export function kindTitle(kind: FittingKind, dict: Dictionary = uk) {
  const k = dict.kinds[kind];
  return `${k.designation} — ${k.name}`;
}

export const rowTitle = (row: FormRow, dict: Dictionary = uk) => kindTitle(row.kind, dict);

/** The letter of each size field, as on the sketch (ADR 0034): branches share the small-end letters. */
const sizeSymbol = (key: FieldKey, s: Dictionary["symbols"]): string | undefined =>
  ({
    diameter: s.diameter, smallDiameter: s.smallDiameter, branchDiameter: s.smallDiameter,
    width: s.width, height: s.height, smallWidth: s.smallWidth, smallHeight: s.smallHeight,
    branchWidth: s.smallWidth, branchHeight: s.smallHeight,
    length: s.length, offset: s.offset, centerRadius: s.radius, innerRadius: s.radius, angle: s.angle,
  } as Partial<Record<FieldKey, string>>)[key];

/** Short size line of a row for the results, e.g. "a₁×b₁ 400×200 · d₂ 250 · L 1000": tells cloned rows apart. Pairs a×b are joined; allowance and form-only fields are left out. */
export function sizeLabel(row: FormRow, dict: Dictionary = uk): string {
  const s = dict.symbols;
  const v = (k: FieldKey) => row.values[k]?.trim() || "–";
  // an empty optional field (reducer length) takes its default in the core, so it is left out rather than shown as "–"
  const keys = kindFields[row.kind].filter((f) => !(f.optional && !row.values[f.key]?.trim())).map((f) => f.key).filter((k) => sizeSymbol(k, s));
  const parts: string[] = [];
  const pairs: [FieldKey, FieldKey][] = [["width", "height"], ["smallWidth", "smallHeight"], ["branchWidth", "branchHeight"]];
  for (const k of keys) {
    const pair = pairs.find(([a]) => a === k);
    if (pair && keys.includes(pair[1])) parts.push(`${sizeSymbol(pair[0], s)}×${sizeSymbol(pair[1], s)} ${v(pair[0])}×${v(pair[1])}`);
    else if (!pairs.some(([a, b]) => b === k && keys.includes(a))) parts.push(`${sizeSymbol(k, s)} ${v(k)}${k === "angle" ? "°" : ""}`);
  }
  return parts.join(" · ");
}
