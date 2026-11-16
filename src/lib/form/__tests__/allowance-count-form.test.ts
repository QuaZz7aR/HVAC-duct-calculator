import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { hasAllowance, newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const elbow = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1, 'roundElbow'),
  values: { diameter: '250', centerRadius: '250', angle: '90', allowance: '50' },
  flow: '500',
  ...over,
});
const area = (row: FormRow) => {
  const r = calculate([row], air).rows[0];
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.result.metalArea;
};

describe('number of allowances in the form', () => {
  it('empty means 2, and 1 / 0 take one strip of perimeter x allowance each', () => {
    const strip = Math.PI * 0.25 * 0.05 * 1.15; // round elbow d250: waste factor 1.15
    expect(area(elbow())).toBeCloseTo(area(elbow({ allowanceCount: '2' })), 12);
    expect(area(elbow({ allowanceCount: '1' }))).toBeCloseTo(area(elbow()) - strip, 9);
    expect(area(elbow({ allowanceCount: '0' }))).toBeCloseTo(area(elbow()) - 2 * strip, 9);
  });

  it('a value outside 0, 1, 2 is an error, not a silent default', () => {
    const r = calculate([elbow({ allowanceCount: '3' })], air).rows[0];
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.map((i) => i.code)).toContain('allowanceCount.invalid');
  });

  it('is ignored by kinds without an allowance', () => {
    const straight: FormRow = { ...newRow(1), values: { diameter: '150', length: '1000' }, flow: '265', allowanceCount: '0' };
    expect(hasAllowance('roundStraight')).toBe(false);
    expect(calculate([straight], air).rows[0].ok).toBe(true);
  });
});
