import type { CalcConfig } from '../calc/config';
import type { FormRow } from './fields';
import { kindOrder } from './fields';
import { presetRow } from './defaults';

/** One filled row per fitting kind, in the order of the kind list. */
export function sampleRows(config: CalcConfig): FormRow[] {
  return kindOrder.map((kind, i) => presetRow(i + 1, kind, config));
}

/** The full sketch of a card is closed when it appears; the thumbnail opens it (owner, 2026-11-20, ADR 0081). */
export const sketchesOpenByDefault = false;
