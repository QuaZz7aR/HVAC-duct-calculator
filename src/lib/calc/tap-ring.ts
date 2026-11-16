import type { CalcConfig } from './config';
import type { Fitting } from './types';
import { mmToM } from './units';

/** Flat ring around a tap stub in m2, `config.tap.ringWidthMm` wide on every side (ADRs 0043, 0044): part of the actual metal area and the consumption, not of insulation; 0 for other kinds. */
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

