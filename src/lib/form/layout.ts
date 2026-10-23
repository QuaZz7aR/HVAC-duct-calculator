/** Rough width of one character of a field label (text-sm, px) and the room the field grid has (the card inside max-w-6xl, px). */
const charPx = 7.3;
const gridPx = 1040;
const gapPx = 12;
const minInputPx = 150;

/**
 * Columns for a row of inputs so that no label wraps: the widest label sets the input width, which sets how many fit in a row.
 * The inputs are then spread over the fewest rows at the most even count (rows differ by at most one).
 */
export function fieldColumns(labels: string[]): number {
  const n = labels.length;
  if (n <= 1) return Math.max(n, 1);
  const widest = Math.max(...labels.map((l) => l.length)) * charPx + 8;
  const perRow = Math.max(1, Math.floor((gridPx + gapPx) / (Math.max(widest, minInputPx) + gapPx)));
  const rows = Math.ceil(n / perRow);
  return Math.ceil(n / rows);
}

/** Longest label text (with its note or action) that still fits on one line in half a phone card; a longer one gets the full width so it does not push its neighbour down. */
const halfCardChars = 17;

export function isLongLabel(text: string): boolean {
  return text.length > halfCardChars;
}
