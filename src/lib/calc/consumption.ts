import { branchLayout, isTeeCross } from './branch';
import type { CalcConfig } from './config';
import { sheetArea } from './sheet-area';
import type { Fitting } from './types';
import { mmToM } from './units';
import { wasteFactor } from './waste-factor';

/**
 * Metal consumption of one piece without the waste factor, m2 (engineer 2026-11-16, ADR 0042).
 * Reducers: cut at least `config.consumption.minReducerLengthMm` long. Tees and crosses: the branch cut-outs are not subtracted.
 * Taps: the stub plus the flat ring around it (ADR 0043). Every other kind: the actual sheet area. The fitting itself is never changed, so the actual area and insulation keep what was typed.
 */
export function consumptionArea(f: Fitting, config: CalcConfig): number {
  switch (f.kind) {
    case 'roundReducer':
    case 'rectReducer':
    case 'rectToRoundReducer':
      // the same surface, with the axial length raised to the minimum part length
      return sheetArea({ ...f, length: Math.max(f.length, config.consumption.minReducerLengthMm) });
    case 'roundTap':
    case 'rectTap':
      return sheetArea(f) + tapRingArea(f, config);
    default:
      if (isTeeCross(f)) {
        // the cut-out of each branch goes to scrap, so it is added back to the actual area
        const b = branchLayout(f);
        return sheetArea(f) + b.count * b.branchArea;
      }
      return sheetArea(f);
  }
}

/** Flat ring around a tap stub in m2, `config.tap.ringWidthMm` wide on every side (ADR 0043); 0 for other kinds. */
export function tapRingArea(f: Fitting, config: CalcConfig): number {
  const w = mmToM(config.tap.ringWidthMm);
  switch (f.kind) {
    case 'roundTap': {
      // annulus: outer circle of radius d/2 + w minus the stub opening
      const r = mmToM(f.diameter) / 2;
      return Math.PI * ((r + w) ** 2 - r ** 2);
    }
    case 'rectTap': {
      // rectangular frame: outer rectangle (a + 2w)(b + 2w) minus the stub opening ab
      const a = mmToM(f.width);
      const b = mmToM(f.height);
      return (a + 2 * w) * (b + 2 * w) - a * b;
    }
    default:
      return 0;
  }
}

/** Metal consumption of one piece in m2, the cutting-waste factor included: what the order, the sheet list and the price use. */
export function metalConsumption(f: Fitting, config: CalcConfig): number {
  return consumptionArea(f, config) * wasteFactor(f, config);
}

/** True when the consumption of this fitting differs from its actual area by rule (not by the waste factor). */
export function consumptionDiffers(f: Fitting, config: CalcConfig): boolean {
  if (isTeeCross(f)) return true;
  if (f.kind === 'roundTap' || f.kind === 'rectTap') return tapRingArea(f, config) > 0;
  return (
    (f.kind === 'roundReducer' || f.kind === 'rectReducer' || f.kind === 'rectToRoundReducer') &&
    f.length < config.consumption.minReducerLengthMm
  );
}
