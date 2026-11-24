import type { FormRow } from './fields';

/** The rows with `id` moved to position `to` (0-based, clamped to the list); unknown id = unchanged. */
export function moveTo(rows: FormRow[], id: number, to: number): FormRow[] {
  const from = rows.findIndex((r) => r.id === id);
  if (from < 0) return rows;
  const at = Math.max(0, Math.min(rows.length - 1, to));
  if (at === from) return rows;
  const rest = rows.filter((r) => r.id !== id);
  return [...rest.slice(0, at), rows[from], ...rest.slice(at)];
}

/** One step up (-1) or down (+1); at the edge the list stays as it is. */
export const moveBy = (rows: FormRow[], id: number, step: number) => moveTo(rows, id, rows.findIndex((r) => r.id === id) + step);

/** Drag and drop: `id` takes the place of `targetId`, the target shifts toward where `id` came from. */
export const moveOnto = (rows: FormRow[], id: number, targetId: number) => moveTo(rows, id, rows.findIndex((r) => r.id === targetId));

/** The position label of a row: what the user typed (П1, В2), else its list number 1, 2, 3 (ADR 0049). */
export const positionLabel = (row: FormRow, index: number) => row.position?.trim() || String(index + 1);

/** The positions of a section for its title: consecutive numbers as a span "1–3", anything else listed "П1, П2" (ADR 0051). */
export function positionSpan(labels: string[]): string {
  const nums = labels.map(Number);
  const consecutive = labels.length > 1 && labels.every((l) => /^\d+$/.test(l)) && nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return consecutive ? `${labels[0]}–${labels[labels.length - 1]}` : labels.join(", ");
}

/**
 * A block of neighbouring rows (a section, ADR 0052) takes the place of `targetId`, keeping its inner order: moving down it
 * ends where the target stood, moving up it starts there. One id = `moveOnto`. A target inside the block = unchanged.
 */
export function moveBlock(rows: FormRow[], ids: number[], targetId: number): FormRow[] {
  const set = new Set(ids);
  const from = rows.findIndex((r) => set.has(r.id));
  const target = rows.findIndex((r) => r.id === targetId);
  if (from < 0 || target < 0 || set.has(targetId)) return rows;
  const block = rows.filter((r) => set.has(r.id));
  const rest = rows.filter((r) => !set.has(r.id));
  const t = rest.findIndex((r) => r.id === targetId);
  const at = target > from ? t + 1 : t;
  return [...rest.slice(0, at), ...block, ...rest.slice(at)];
}

/** The system of a position: the part before its last «-» with a number after it ("ПВ1-3" -> "ПВ1"); none -> undefined. */
export function systemOf(position: string | undefined): string | undefined {
  const m = position?.trim().match(/^(.+?)\s*-\s*\d+$/);
  return m ? m[1] : undefined;
}

/**
 * «Нумерація по системах» (ADR 0095): positions «система-№» (ПВ1-1, ПВ1-2), as the import writes them.
 * A row's system is the one in its position, else `system` (the typed one); a row with neither keeps its position.
 * `scope: 'all'` renumbers every row 1, 2, 3 within its system in list order; `'empty'` gives only the rows without a
 * position the typed system, numbered after the largest number that system already has. Order of the rows is unchanged.
 */
export function numberBySystems(rows: FormRow[], system: string, scope: 'all' | 'empty'): FormRow[] {
  const typed = system.trim();
  const next = new Map<string, number>();
  if (scope === 'empty')
    for (const r of rows) {
      const s = systemOf(r.position);
      const n = Number(r.position?.trim().match(/(\d+)$/)?.[1]);
      if (s !== undefined) next.set(s, Math.max(next.get(s) ?? 0, n));
    }
  return rows.map((r) => {
    const has = !!r.position?.trim();
    if (scope === 'empty' && has) return r;
    const s = (scope === 'all' ? systemOf(r.position) : undefined) ?? (typed || undefined);
    if (s === undefined) return r;
    const n = (next.get(s) ?? 0) + 1;
    next.set(s, n);
    return { ...r, position: `${s}-${n}` };
  });
}
