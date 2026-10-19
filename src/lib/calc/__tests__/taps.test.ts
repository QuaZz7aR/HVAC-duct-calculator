import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { assembleSection } from '../section';
import { centerlineLength, developedLength, sheetArea } from '../sheet-area';
import { sheetList } from '../sheet-list';
import { thickness, thicknessSize } from '../thickness';
import { fittingWarnings } from '../warnings';
import { metalArea, wasteFactor } from '../waste-factor';
import type { Fitting } from '../types';
import { tapCases } from '../__fixtures__/taps.fixtures';

const air = { density: 1.2, kinematicViscosity: 1.5e-5 };

describe('tap sheet area', () => {
  it.each(tapCases)('$id', ({ input, area }) => {
    expect(sheetArea(input)).toBeCloseTo(area, 6);
  });

  it.each(tapCases)('$id: metal area has no waste factor', ({ input, area }) => {
    expect(wasteFactor(input, defaultConfig)).toBe(1);
    expect(metalArea(input, defaultConfig)).toBeCloseTo(area, 6);
  });

  it('developed length is the stub length, with no allowance', () => {
    expect(developedLength({ kind: 'roundTap', diameter: 150, length: 100 })).toBeCloseTo(0.1, 9);
  });

  it('is the same as a straight duct of the stub length', () => {
    const tap: Fitting = { kind: 'rectTap', width: 300, height: 100, length: 100 };
    const straight: Fitting = { kind: 'rectStraight', width: 300, height: 100, length: 100 };
    expect(sheetArea(tap)).toBeCloseTo(sheetArea(straight), 12);
  });
});

describe('tap thickness and sheet list', () => {
  it.each(tapCases)('$id: thickness', ({ input, thicknessMm }) => {
    expect(thickness(thicknessSize(input), defaultConfig)).toBe(thicknessMm);
  });

  it('sheet list multiplies by quantity and groups by the tap thickness', () => {
    const tap: Fitting = { kind: 'roundTap', diameter: 150, length: 100 };
    const [group] = sheetList([{ fitting: tap, quantity: 4 }], defaultConfig);
    expect(group.thicknessMm).toBe(0.5);
    expect(group.area).toBeCloseTo(4 * 0.04712389, 6);
  });
});

describe('tap warnings and section', () => {
  it('rect tap 300x100 warns about the aspect ratio like any rect fitting', () => {
    const tap: Fitting = { kind: 'rectTap', width: 300, height: 100, length: 100 };
    expect(fittingWarnings(tap, defaultConfig).map((w) => w.code)).toEqual(['aspect.high']);
  });

  it('assembles with zero centerline length (a stub off the main flow)', () => {
    const fitting: Fitting = { kind: 'roundTap', diameter: 150, length: 100 };
    expect(centerlineLength(fitting)).toBe(0);
    const r = assembleSection({ fitting, flow: 265, localCoefficient: 0 }, air, defaultConfig);
    expect(r.metalArea).toBeCloseTo(0.04712389, 6);
    expect(r.pressureDrop.frictionLoss).toBe(0);
  });
});
