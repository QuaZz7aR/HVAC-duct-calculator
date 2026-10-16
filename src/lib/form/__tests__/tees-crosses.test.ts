import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { teeCrossCases } from '../../calc/__fixtures__/tees-crosses.fixtures';
import { fittingWarnings } from '../../calc/warnings';
import { fittingSchema } from '../../validation';
import { calculate } from '../calculate';
import { initialValues, kindFields, kindOrder, type FieldKey, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };

/** A form row filled with the fixture's sizes (raw text, as typed). */
function rowFor(id: number, fitting: Record<string, unknown>): FormRow {
  const kind = fitting.kind as FormRow['kind'];
  const values = initialValues(kind);
  for (const f of kindFields[kind]) values[f.key] = String(fitting[f.key]);
  return { id, kind, values, quantity: '1', flow: '500', zeta: '0.3' };
}

describe('tees and crosses in the form layer', () => {
  it('every kind is selectable and has a field list', () => {
    for (const { input } of teeCrossCases) expect(kindOrder).toContain(input.kind);
  });

  it.each(teeCrossCases)('$id: form text -> validation -> the fixture area', ({ input, area }) => {
    const calc = calculate([rowFor(1, input)], air);
    const out = calc.rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.metalArea).toBeCloseTo(area, 6);
    expect(calc.sheetList[0].area).toBeCloseTo(area, 6);
  });

  it('the field list is exactly the schema keys', () => {
    for (const { input } of teeCrossCases) {
      const keys = kindFields[input.kind].map((f) => f.key as FieldKey).sort();
      expect(keys).toEqual(Object.keys(input).filter((k) => k !== 'kind').sort());
    }
  });
});

describe('tee and cross validation', () => {
  it('rejects a non-positive branch size and a negative allowance', () => {
    const r = fittingSchema.safeParse({ kind: 'roundTee', diameter: 150, branchDiameter: 0, allowance: 50 });
    expect(r.success).toBe(false);
    const n = fittingSchema.safeParse({ kind: 'rectCross', width: 300, height: 200, branchWidth: 200, branchHeight: 100, allowance: -1 });
    expect(n.success).toBe(false);
  });
  it('rejects a missing branch field', () => {
    expect(fittingSchema.safeParse({ kind: 'rectTee', width: 300, height: 200, allowance: 50 }).success).toBe(false);
  });
});

describe('tee and cross warnings', () => {
  it('checks the aspect ratio of the rect main and of the rect branch', () => {
    const codes = (f: Parameters<typeof fittingWarnings>[0]) => fittingWarnings(f, defaultConfig).map((w) => w.code);
    expect(codes({ kind: 'rectTeeRoundBranch', width: 600, height: 200, branchDiameter: 150, allowance: 50 })).toEqual(['aspect.high']);
    expect(codes({ kind: 'roundTeeRectBranch', diameter: 300, branchWidth: 300, branchHeight: 100, allowance: 50 })).toEqual(['aspect.high']);
    expect(codes({ kind: 'roundCross', diameter: 315, branchDiameter: 200, allowance: 50 })).toEqual([]);
  });
  it('warns when the branch cross-section is larger than the main duct', () => {
    const w = fittingWarnings({ kind: 'roundTee', diameter: 100, branchDiameter: 200, allowance: 50 }, defaultConfig);
    expect(w).toEqual([{ code: 'branch.larger', level: 'warning', value: 4, limit: 1 }]);
    // equal sections (the fixtures) are fine
    expect(fittingWarnings({ kind: 'roundTee', diameter: 150, branchDiameter: 150, allowance: 50 }, defaultConfig)).toEqual([]);
  });
  it('warns about a branch over 2000 mm', () => {
    expect(fittingWarnings({ kind: 'roundTee', diameter: 2200, branchDiameter: 2100, allowance: 50 }, defaultConfig)[0].code).toBe('size.overLimit');
  });
});
