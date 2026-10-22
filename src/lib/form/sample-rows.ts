import type { CalcConfig } from '../calc/config';
import { applyAutoDefaults } from './auto-defaults';
import { initialValues, kindOrder, newRow, type FittingKind, type FormRow } from './fields';

/** Example sizes (mm) for the beta page: one plausible part of every kind, so each card shows its sketch and a result at once. */
const sampleValues: Record<FittingKind, FormRow['values']> = {
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

/** One filled row per fitting kind, in the order of the kind list. */
export function sampleRows(config: CalcConfig): FormRow[] {
  return kindOrder.map((kind, i) =>
    applyAutoDefaults({ ...newRow(i + 1, kind), values: { ...initialValues(kind), ...sampleValues[kind] } }, config),
  );
}
