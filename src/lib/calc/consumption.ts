import { branchLayout, isTeeCross } from './branch';
import type { CalcConfig } from './config';
import { sheetArea } from './sheet-area';
import type { Fitting } from './types';
import { wasteFactor } from './waste-factor';

/**
 * Metal consumption of one piece without the waste factor, m2 (engineer 2026-11-16, ADR 0042).
 * Reducers: cut at least `config.consumption.minReducerLengthMm` long. Tees and crosses: the branch cut-outs are not subtracted.
 * Every other kind: the actual sheet area. The fitting itself is never changed, so the actual area and insulation keep what was typed.
 */
export function consumptionArea(f: Fitting, config: CalcConfig): number {
  switch (f.kind) {
    case 'roundReducer':
    case 'rectReducer':
    case 'rectToRoundReducer':
      // the same surface, with the axial length raised to the minimum part length
      return sheetArea({ ...f, length: Math.max(f.length, config.consumption.minReducerLengthMm) });
    default:
      if (isTeeCross(f)) {
        // the cut-out of each branch goes to scrap, so it is added back to the actual area
        const b = branchLayout(f);
        return sheetArea(f) + b.count * b.branchArea;
      }
      return sheetArea(f);
  }
}

/** Metal consumption of one piece in m2, the cutting-waste factor included: what the order, the sheet list and the price use. */
export function metalConsumption(f: Fitting, config: CalcConfig): number {
  return consumptionArea(f, config) * wasteFactor(f, config);
}

/** True when the consumption of this fitting differs from its actual area by rule (not by the waste factor). */
export function consumptionDiffers(f: Fitting, config: CalcConfig): boolean {
  if (isTeeCross(f)) return true;
  return (
    (f.kind === 'roundReducer' || f.kind === 'rectReducer' || f.kind === 'rectToRoundReducer') &&
    f.length < config.consumption.minReducerLengthMm
  );
}
