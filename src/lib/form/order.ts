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
