import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { consumptionArea } from '../consumption';
import { insulationArea } from '../insulation';
import { centerlineLength, sheetArea } from '../sheet-area';
import { thickness, thicknessSize } from '../thickness';
import { metalArea } from '../waste-factor';
import type { Fitting } from '../types';
import { createSchemas } from '../../validation/schemas';
import { boxOffsetCases } from '../__fixtures__/box-offset.fixtures';

describe('adapter / box and offsets (BETA, ADR 0113)', () => {
  it.each(boxOffsetCases)('$id: sheet area', ({ input, area }) => {
    expect(sheetArea(input)).toBeCloseTo(area, 6);
  });

  it.each(boxOffsetCases)('$id: centerline', ({ input, centerline }) => {
    expect(centerlineLength(input)).toBeCloseTo(centerline, 6);
  });

  it.each(boxOffsetCases)('$id: thickness', ({ input, thicknessMm }) => {
    expect(thickness(thicknessSize(input), defaultConfig)).toBe(thicknessMm);
  });

  it.each(boxOffsetCases)('$id: no waste factor, consumption = actual area', ({ input, area }) => {
    expect(metalArea(input, defaultConfig)).toBeCloseTo(area, 6);
    expect(consumptionArea(input, defaultConfig)).toBeCloseTo(area, 6);
  });

  it('an offset with no shift is a straight of the same length plus the allowance strips', () => {
    const rect: Fitting = { kind: 'rectOffset', width: 400, height: 200, length: 500, offset: 0, allowance: 50 };
    expect(sheetArea(rect)).toBeCloseTo(sheetArea({ kind: 'rectStraight', width: 400, height: 200, length: 600 }), 12);
    const round: Fitting = { kind: 'roundOffset', diameter: 200, length: 500, offset: 0, allowance: 50, allowanceCount: 0 };
    expect(sheetArea(round)).toBeCloseTo(sheetArea({ kind: 'roundStraight', diameter: 200, length: 500 }), 12);
  });

  it('rect offset: the walls in the offset plane stay flat (a x L), the other pair runs along the slant', () => {
    const f: Fitting = { kind: 'rectOffset', width: 200, height: 400, length: 350, offset: 120, allowance: 0 };
    expect(sheetArea(f)).toBeCloseTo(2 * 0.2 * 0.35 + 2 * 0.4 * 0.37, 9);
  });

  it('an open box (no ends, no partitions) is a straight', () => {
    const box: Fitting = { kind: 'rectBox', width: 600, height: 300, length: 500, ends: 0, partitions: 0 };
    expect(sheetArea(box)).toBeCloseTo(sheetArea({ kind: 'rectStraight', width: 600, height: 300, length: 500 }), 12);
  });

  it('insulation grows every cross-section size by 2t', () => {
    const box: Fitting = { kind: 'rectBox', width: 600, height: 300, length: 500, ends: 2, partitions: 0 };
    expect(insulationArea(box, 10, defaultConfig)).toBeCloseTo(sheetArea({ ...box, width: 620, height: 320 }), 9);
  });

  it('validation rejects bad ends, partitions and a negative offset', () => {
    const { fitting } = createSchemas(defaultConfig);
    const codes = (v: unknown) => (fitting.safeParse(v).error?.issues ?? []).map((i) => i.message);
    expect(codes({ kind: 'rectBox', width: 600, height: 300, length: 500, ends: 3, partitions: 0 })).toContain('box.ends');
    expect(codes({ kind: 'rectBox', width: 600, height: 300, length: 500, ends: 2, partitions: 1.5 })).toContain('box.partitions');
    expect(codes({ kind: 'roundOffset', diameter: 200, length: 500, offset: -1, allowance: 50 })).toContain('offset.negative');
    expect(fitting.safeParse({ kind: 'rectOffset', width: 400, height: 200, length: 500, offset: 100, allowance: 50 }).success).toBe(true);
  });
});
