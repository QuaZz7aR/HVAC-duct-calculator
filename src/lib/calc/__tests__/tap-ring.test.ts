import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { consumptionArea, consumptionDiffers, tapRingArea } from '../consumption';
import { sheetArea } from '../sheet-area';
import type { Fitting } from '../types';
import { tapRingCases } from '../__fixtures__/tap-ring.fixtures';

describe('tap ring (ADR 0043)', () => {
  it.each(tapRingCases)('$id', ({ input, ring, consumption }) => {
    expect(tapRingArea(input, defaultConfig)).toBeCloseTo(ring, 6);
    expect(consumptionArea(input, defaultConfig)).toBeCloseTo(consumption, 6);
    expect(consumptionDiffers(input, defaultConfig)).toBe(true);
  });

  it('keeps the actual area on the stub only', () => {
    const f: Fitting = { kind: 'roundTap', diameter: 200, length: 100 };
    expect(sheetArea(f)).toBeCloseTo(Math.PI * 0.2 * 0.1, 12);
    expect(consumptionArea(f, defaultConfig)).toBeGreaterThan(sheetArea(f));
  });

  it('a ring width of 0 turns the ring off', () => {
    const f: Fitting = { kind: 'rectTap', width: 300, height: 100, length: 100 };
    const cfg = { ...defaultConfig, tap: { ringWidthMm: 0 } };
    expect(consumptionArea(f, cfg)).toBeCloseTo(sheetArea(f), 12);
    expect(consumptionDiffers(f, cfg)).toBe(false);
  });

  it('other kinds have no ring', () => {
    expect(tapRingArea({ kind: 'roundStraight', diameter: 200, length: 1000 }, defaultConfig)).toBe(0);
  });
});
