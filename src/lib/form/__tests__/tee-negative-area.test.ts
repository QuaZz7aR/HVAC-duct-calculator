import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const teeRow = (branchHeight: string): FormRow => ({
  ...newRow(1, 'rectTee'),
  values: { width: '100', height: '100', branchWidth: '100', branchHeight, allowance: '0' },
  flow: '500',
});

describe('tee with a cut-out larger than the wall', () => {
  it('is rejected instead of giving a negative metal area', () => {
    const calc = calculate([teeRow('1000')], air);
    expect(calc.rows[0]).toEqual({ ok: false, id: 1, issues: [{ code: 'input.invalid', path: [] }] });
    expect(calc.sheetList).toEqual([]);
    expect(calc.totalMetalArea).toBe(0);
  });
  it('a normal tee still calculates', () => {
    expect(calculate([teeRow('100')], air).rows[0].ok).toBe(true);
  });
});
