import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { consumptionArea, consumptionDiffers, metalConsumption } from '../consumption';
import { sheetArea } from '../sheet-area';
import { sheetList } from '../sheet-list';
import type { Fitting } from '../types';
import { metalArea } from '../waste-factor';
import { consumptionCases } from '../__fixtures__/consumption.fixtures';

describe('metal consumption', () => {
  it.each(consumptionCases)('$id', ({ input, consumption }) => {
    expect(consumptionArea(input, defaultConfig)).toBeCloseTo(consumption, 6);
  });

  it('never changes the fitting or its actual area', () => {
    const f: Fitting = { kind: 'roundReducer', diameter: 315, smallDiameter: 200, length: 150, allowance: 50 };
    const before = sheetArea(f);
    expect(consumptionArea(f, defaultConfig)).toBeGreaterThan(before);
    expect(f.length).toBe(150);
    expect(sheetArea(f)).toBe(before);
  });

  it('equals the actual metal area for every other kind, waste factor included', () => {
    const elbow: Fitting = { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50 };
    const duct: Fitting = { kind: 'rectStraight', width: 500, height: 300, length: 1000 };
    for (const f of [elbow, duct]) {
      expect(metalConsumption(f, defaultConfig)).toBe(metalArea(f, defaultConfig));
      expect(consumptionDiffers(f, defaultConfig)).toBe(false);
    }
  });

  it('follows the configured minimum length', () => {
    const f: Fitting = { kind: 'roundReducer', diameter: 315, smallDiameter: 200, length: 150, allowance: 50 };
    const cfg = { ...defaultConfig, consumption: { minReducerLengthMm: 150 } };
    expect(consumptionArea(f, cfg)).toBeCloseTo(sheetArea(f), 12);
    expect(consumptionDiffers(f, cfg)).toBe(false);
    expect(consumptionDiffers(f, defaultConfig)).toBe(true);
  });

  it('sheetList sums the consumption when asked, the actual area by default', () => {
    const tee: Fitting = { kind: 'roundTee', diameter: 200, branchDiameter: 150, allowance: 50 };
    const items = [{ fitting: tee, quantity: 2 }];
    expect(sheetList(items, defaultConfig)[0].area).toBeCloseTo(2 * metalArea(tee, defaultConfig), 12);
    expect(sheetList(items, defaultConfig, metalConsumption)[0].area).toBeCloseTo(2 * metalConsumption(tee, defaultConfig), 12);
  });
});
