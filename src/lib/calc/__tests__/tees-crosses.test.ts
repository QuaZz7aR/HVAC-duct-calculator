import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { assembleSection } from '../section';
import { centerlineLength, developedLength, sheetArea } from '../sheet-area';
import { thickness, thicknessSize } from '../thickness';
import { metalArea, wasteFactor } from '../waste-factor';
import { sheetList } from '../sheet-list';
import type { Fitting } from '../types';
import { teeCrossCases } from '../__fixtures__/tees-crosses.fixtures';

const air = { density: 1.2, kinematicViscosity: 1.5e-5 };

/** Branch size along the main axis, mm (Excel column E). */
const along = (f: Fitting) =>
  'branchDiameter' in f ? f.branchDiameter : 'branchWidth' in f ? f.branchWidth : NaN;

describe('tee and cross sheet area', () => {
  it.each(teeCrossCases)('$id ($excelCode)', ({ input, area }) => {
    expect(sheetArea(input)).toBeCloseTo(area, 6);
  });

  it.each(teeCrossCases)('$id: fixture parts add up to the area', ({ area, body, collar, opening }) => {
    expect(body + collar - opening).toBeCloseTo(area, 6);
  });

  it.each(teeCrossCases)('$id: metal area has no waste factor', ({ input, area }) => {
    expect(wasteFactor(input, defaultConfig)).toBe(1);
    expect(metalArea(input, defaultConfig)).toBeCloseTo(area, 6);
  });
});

describe('tee and cross geometry', () => {
  it.each(teeCrossCases)('$id: developed length is E + 2 x allowance', ({ input }) => {
    // main run length, shared by metal and insulation
    const f = input as Extract<Fitting, { allowance: number }>;
    expect(developedLength(input)).toBeCloseTo((along(input) + 2 * f.allowance) / 1000, 9);
  });

  it.each(teeCrossCases)('$id: centerline is the branch size along the axis, no allowance', ({ input }) => {
    // TODO(confirm): centerline of the main run = E (see decisions.md)
    expect(centerlineLength(input)).toBeCloseTo(along(input) / 1000, 9);
  });

  it('centerline ignores the allowance, the area does not', () => {
    const a: Fitting = { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50 };
    const b: Fitting = { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 80 };
    expect(centerlineLength(b)).toBe(centerlineLength(a));
    expect(sheetArea(b)).toBeGreaterThan(sheetArea(a));
  });

  it('a cross doubles the collar and the opening of the same tee', () => {
    const tee: Fitting = { kind: 'rectTee', width: 350, height: 150, branchWidth: 350, branchHeight: 150, allowance: 50 };
    const cross: Fitting = { kind: 'rectCross', width: 350, height: 150, branchWidth: 350, branchHeight: 150, allowance: 50 };
    // (collar - opening) per branch: 0.05 - 0.0525
    expect(sheetArea(cross) - sheetArea(tee)).toBeCloseTo(0.05 - 0.0525, 9);
  });
});

describe('tee and cross thickness', () => {
  it.each([
    ['round main D399 -> 0.55', { kind: 'roundTee', diameter: 399, branchDiameter: 600, allowance: 50 }, 0.55],
    ['round main D400 -> 0.7', { kind: 'roundCross', diameter: 400, branchDiameter: 100, allowance: 50 }, 0.7],
    ['rect main keyed by its larger side', { kind: 'rectTeeRoundBranch', width: 400, height: 100, branchDiameter: 100, allowance: 50 }, 0.7],
  ] as [string, Fitting, number][])('%s', (_, fitting, expected) => {
    // the main duct keys the thickness, never the branch
    expect(thickness(thicknessSize(fitting), defaultConfig)).toBe(expected);
  });

  it('sheet list groups a tee by its main duct thickness', () => {
    const tee: Fitting = { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50 };
    const [group] = sheetList([{ fitting: tee, quantity: 2 }], defaultConfig);
    expect(group.thicknessMm).toBe(0.55);
    expect(group.area).toBeCloseTo(2 * 0.123700211, 6);
  });
});

describe('tee and cross section assembly', () => {
  it('uses the main duct section and the centerline', () => {
    const fitting: Fitting = { kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50 };
    const r = assembleSection({ fitting, flow: 265, localCoefficient: 0.5 }, air, defaultConfig);
    expect(r.metalArea).toBeCloseTo(0.123700211, 6);
    expect(r.centerlineLength).toBeCloseTo(0.15, 9);
    // 265 m3/h through D150: same velocity as the straight round-d150 fixture
    expect(r.pressureDrop.velocity).toBeCloseTo(4.165536782, 6);
  });
});
