import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { initialValues, newRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };

// ADR 0120: a damper row starts with the casing length prefill and counts like a straight of that length, per piece
describe('damper and check valve rows', () => {
  it('prefill the casing length', () => {
    expect(initialValues('roundDamper').length).toBe('200');
    expect(initialValues('rectCheckValve').length).toBe('200');
  });

  it('count the casing per piece', () => {
    const row = { ...newRow(1, 'rectDamper'), values: { width: '400', height: '200', length: '200' }, quantity: '3', flow: '500', zeta: '0' };
    const calc = calculate([row], air);
    const out = calc.rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.metalArea).toBeCloseTo(0.24, 9);
    expect(calc.totalMetalArea).toBeCloseTo(0.72, 9);
  });
});
