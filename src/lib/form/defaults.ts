import type { CalcConfig } from '../calc/config';
import { applyAutoDefaults } from './auto-defaults';
import { initialValues, newRow, type FittingKind, type FormRow } from './fields';

/** Default sizes (mm) a new row of each kind starts with: one plausible part, so the card shows a result at once. They are placeholders, not recommendations. */
const defaultSizes: Record<FittingKind, FormRow['values']> = {
  roundStraight: { diameter: '250', length: '1000' },
  rectStraight: { width: '400', height: '200', length: '1000' },
  roundElbow: { diameter: '250' },
  rectElbow: { width: '400', height: '200' },
  roundReducer: { diameter: '315', smallDiameter: '200' },
  rectReducer: { width: '400', height: '300', smallWidth: '300', smallHeight: '200' },
  rectToRoundReducer: { width: '400', height: '200', smallDiameter: '250' },
  roundCap: { diameter: '250', length: '50' },
  rectCap: { width: '400', height: '200', length: '50' },
  roundTap: { diameter: '160' },
  rectTap: { width: '200', height: '150' },
  roundTee: { diameter: '315', branchDiameter: '200' },
  roundTeeRectBranch: { diameter: '400', branchWidth: '250', branchHeight: '150' },
  rectTee: { width: '500', height: '300', branchWidth: '250', branchHeight: '200' },
  rectTeeRoundBranch: { width: '500', height: '300', branchDiameter: '200' },
  roundCross: { diameter: '400', branchDiameter: '200' },
  roundCrossRectBranches: { diameter: '500', branchWidth: '250', branchHeight: '150' },
  rectCross: { width: '600', height: '300', branchWidth: '250', branchHeight: '200' },
  rectCrossRoundBranches: { width: '600', height: '300', branchDiameter: '200' },
};

/** Prefills of the kind plus its default sizes. */
export function defaultValues(kind: FittingKind): FormRow['values'] {
  return { ...initialValues(kind), ...defaultSizes[kind] };
}

/** A new row of `kind` holding the default values, marked `preset` until the user changes something. */
export function presetRow(id: number, kind: FittingKind, config: CalcConfig): FormRow {
  return applyAutoDefaults({ ...newRow(id, kind), values: defaultValues(kind), preset: true }, config);
}
