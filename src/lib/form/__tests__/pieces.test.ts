import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { initialValues, newRow, type FormRow } from '../fields';
import { splitLength } from '../pieces';

const air = { temperatureC: '22', pressurePa: '101308' };
const straight = (values: FormRow['values']): FormRow => ({ ...newRow(1, 'roundStraight'), values, flow: '500' });

describe('splitLength', () => {
  it('splits 22.5 m by 3 m into 7 x 3 m + 1 x 1.5 m', () => {
    expect(splitLength(22500, 3000)).toEqual({ full: 7, pieceMm: 3000, restMm: 1500 });
  });
  it('gives no remainder for a multiple', () => {
    expect(splitLength(9000, 3000)).toEqual({ full: 3, pieceMm: 3000, restMm: 0 });
  });
  it('handles a fractional cap', () => {
    const p = splitLength(3000, 1250.5)!;
    expect(p.full).toBe(2);
    expect(p.restMm).toBeCloseTo(499, 6);
  });
  it('does not split a straight at or under the cap', () => {
    expect(splitLength(3000, 3000)).toBeNull();
    expect(splitLength(1000, 3000)).toBeNull();
  });
  it('is off for an empty or zero cap', () => {
    expect(splitLength(22500, undefined)).toBeNull();
    expect(splitLength(22500, 0)).toBeNull();
  });
});

describe('calculate: straight pieces', () => {
  it('prefills 3000 mm for round and 1250 mm for rect straights', () => {
    expect(initialValues('roundStraight').maxPiece).toBe('3000');
    expect(initialValues('rectStraight').maxPiece).toBe('1250');
  });

  it('reports the pieces and keeps the area of the whole straight', () => {
    const split = calculate([straight({ diameter: '250', length: '22500', maxPiece: '3000' })], air).rows[0];
    const whole = calculate([straight({ diameter: '250', length: '22500', maxPiece: '' })], air).rows[0];
    expect(split.ok && whole.ok).toBe(true);
    if (!split.ok || !whole.ok) return;
    expect(split.result.pieces).toEqual({ full: 7, pieceMm: 3000, restMm: 1500 });
    expect(whole.result.pieces).toBeNull();
    expect(split.result.metalArea).toBe(whole.result.metalArea);
    expect(split.result.metalArea).toBeCloseTo(Math.PI * 0.25 * 22.5, 9);
  });

  it('rejects a non-numeric or negative cap', () => {
    for (const maxPiece of ['abc', '-1']) {
      const out = calculate([straight({ diameter: '250', length: '22500', maxPiece })], air).rows[0];
      expect(out.ok).toBe(false);
      if (out.ok) return;
      expect(out.issues.map((i) => i.path)).toEqual([['maxPiece']]);
    }
  });
});
