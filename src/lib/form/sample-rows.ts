import type { CalcConfig } from '../calc/config';
import type { FormRow } from './fields';
import { kindOrder } from './fields';
import { presetRow } from './defaults';

/** One filled row per fitting kind, in the order of the kind list. */
export function sampleRows(config: CalcConfig): FormRow[] {
  return kindOrder.map((kind, i) => presetRow(i + 1, kind, config));
}

/** Beta: the sketches of a card are open when it appears (also for added rows). Set to false when the beta ends. */
export const sketchesOpenByDefault = true;
