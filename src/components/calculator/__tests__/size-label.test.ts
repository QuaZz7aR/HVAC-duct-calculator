import { describe, expect, it } from 'vitest';
import { en } from '@/lib/i18n/en';
import { uk } from '@/lib/i18n/uk';
import { newRow, type FormRow } from '@/lib/form/fields';
import { sizeLabel } from '../format';

const row = (kind: FormRow['kind'], values: FormRow['values']): FormRow => ({ ...newRow(1, kind), values });

describe('sizeLabel', () => {
  it('joins width and height, uses the small-end letters for branches, skips the allowance', () => {
    expect(sizeLabel(row('rectCrossRoundBranches', { width: '600', height: '400', branchDiameter: '250', allowance: '50' }), uk)).toBe('a₁×b₁ 600×400 · d₂ 250');
  });
  it('shows length, radius and angle and marks empty values', () => {
    expect(sizeLabel(row('roundElbow', { diameter: '250', centerRadius: '', angle: '90' }), uk)).toBe('d₁ 250 · R – · α 90°');
    expect(sizeLabel(row('rectStraight', { width: '400', height: '200', length: '1000', maxPiece: '1250' }), en)).toBe('a₁×b₁ 400×200 · L 1000');
  });
  it('leaves out an empty optional length', () => {
    expect(sizeLabel(row('roundReducer', { diameter: '315', smallDiameter: '200', length: '' }), uk)).toBe('d₁ 315 · d₂ 200');
  });
  it('tells a clone with other sizes apart', () => {
    const a = row('rectReducer', { width: '400', height: '200', smallWidth: '300', smallHeight: '200', length: '300' });
    const b = { ...a, values: { ...a.values, smallWidth: '250' } };
    expect(sizeLabel(a)).not.toBe(sizeLabel(b));
  });
});
