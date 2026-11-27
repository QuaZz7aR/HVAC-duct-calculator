import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { insulationArea } from '../insulation';
import { metalArea, wasteFactor } from '../waste-factor';
import { metalConsumption } from '../consumption';
import { centerlineLength, sheetArea } from '../sheet-area';
import { thickness, thicknessSize } from '../thickness';
import type { Fitting } from '../types';

// Dampers and check valves (ADR 0120): the casing is a short duct, so every figure equals a straight of the same size and length.
const pairs: [Fitting, Fitting][] = [
  [{ kind: 'roundDamper', diameter: 250, length: 200 }, { kind: 'roundStraight', diameter: 250, length: 200 }],
  [{ kind: 'roundCheckValve', diameter: 315, length: 250 }, { kind: 'roundStraight', diameter: 315, length: 250 }],
  [{ kind: 'rectDamper', width: 400, height: 200, length: 200 }, { kind: 'rectStraight', width: 400, height: 200, length: 200 }],
  [{ kind: 'rectCheckValve', width: 600, height: 300, length: 300 }, { kind: 'rectStraight', width: 600, height: 300, length: 300 }],
];

describe('dampers and check valves', () => {
  it('take the casing area of a straight of the same size and length', () => {
    // π · 0.25 · 0.2 and 2 (0.4 + 0.2) · 0.2
    expect(sheetArea(pairs[0][0])).toBeCloseTo(Math.PI * 0.25 * 0.2, 9);
    expect(sheetArea(pairs[2][0])).toBeCloseTo(0.24, 9);
    for (const [v, s] of pairs) {
      expect(sheetArea(v)).toBeCloseTo(sheetArea(s), 12);
      expect(metalArea(v, defaultConfig)).toBeCloseTo(metalArea(s, defaultConfig), 12);
      expect(metalConsumption(v, defaultConfig)).toBeCloseTo(metalConsumption(s, defaultConfig), 12);
      expect(wasteFactor(v, defaultConfig)).toBe(wasteFactor(s, defaultConfig));
      expect(centerlineLength(v)).toBeCloseTo(centerlineLength(s), 12);
      expect(thickness(thicknessSize(v), defaultConfig)).toBe(thickness(thicknessSize(s), defaultConfig));
      expect(insulationArea(v, 20, defaultConfig)).toBeCloseTo(insulationArea(s, 20, defaultConfig), 12);
    }
  });
});
