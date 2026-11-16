import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { consumptionArea, consumptionDiffers, tapRingArea } from '../consumption';
import { insulationArea } from '../insulation';
import { sheetArea } from '../sheet-area';
import { metalArea } from '../waste-factor';
import type { Fitting } from '../types';
import { tapRingCases } from '../__fixtures__/tap-ring.fixtures';

describe('tap ring (ADRs 0043, 0044)', () => {
  it.each(tapRingCases)('$id', ({ input, ring, consumption }) => {
    expect(tapRingArea(input, defaultConfig)).toBeCloseTo(ring, 6);
    expect(consumptionArea(input, defaultConfig)).toBeCloseTo(consumption, 6);
    // the ring is part of the actual metal area too (engineer 2026-11-16), so consumption and actual area agree
    expect(metalArea(input, defaultConfig)).toBeCloseTo(consumption, 6);
    expect(consumptionDiffers(input, defaultConfig)).toBe(false);
  });

  it('keeps the wall geometry and the insulation on the stub only', () => {
    const f: Fitting = { kind: 'roundTap', diameter: 200, length: 100 };
    expect(sheetArea(f)).toBeCloseTo(Math.PI * 0.2 * 0.1, 12);
    expect(insulationArea(f, 10, defaultConfig)).toBeCloseTo(Math.PI * 0.22 * 0.1, 12);
  });

  it('a ring width of 0 turns the ring off', () => {
    const f: Fitting = { kind: 'rectTap', width: 300, height: 100, length: 100 };
    const cfg = { ...defaultConfig, tap: { ringWidthMm: 0 } };
    expect(consumptionArea(f, cfg)).toBeCloseTo(sheetArea(f), 12);
    expect(metalArea(f, cfg)).toBeCloseTo(sheetArea(f), 12);
  });

  it('other kinds have no ring', () => {
    expect(tapRingArea({ kind: 'roundStraight', diameter: 200, length: 1000 }, defaultConfig)).toBe(0);
  });
});
