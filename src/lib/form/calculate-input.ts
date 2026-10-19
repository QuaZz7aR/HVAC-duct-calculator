/** Raw text -> number. Accepts a decimal comma; empty -> undefined; anything else non-numeric -> NaN. */
export function parseNumber(text: string | undefined): number | undefined {
  const t = (text ?? '').trim().replace(',', '.');
  if (t === '') return undefined;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN; // a very long digit string overflows to Infinity
}
