import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { initialValues, newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };

describe('calculate: branch-in taps', () => {
  it('prefills the tap length with 100 mm', () => {
    expect(initialValues('roundTap')).toEqual({ diameter: '', length: '100' });
    expect(initialValues('rectTap')).toEqual({ width: '', height: '', length: '100' });
  });

  it('calculates a round tap from the form text', () => {
    const row: FormRow = { ...newRow(1, 'roundTap'), values: { diameter: '150', length: '100' }, flow: '265' };
    const out = calculate([row], air).rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.metalArea).toBeCloseTo(0.04712389, 6);
  });
});
