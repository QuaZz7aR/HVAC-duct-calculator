import { describe, expect, it } from 'vitest';
import { costTotal, lineCost } from '../price';

describe('lineCost', () => {
  it('is area x price per m2', () => {
    expect(lineCost(12.5, 320)).toBeCloseTo(4000, 9);
    expect(lineCost(3, 0)).toBe(0);
  });
  it('a line without a price has no cost, never zero', () => {
    expect(lineCost(3, undefined)).toBeUndefined();
  });
  it('rejects a negative or non-finite price', () => {
    expect(() => lineCost(1, -1)).toThrow();
    expect(() => lineCost(1, NaN)).toThrow();
  });
});

describe('costTotal', () => {
  it('sums priced lines and counts the unpriced ones', () => {
    expect(costTotal([100, undefined, 50.5])).toEqual({ total: 150.5, unpriced: 1 });
    expect(costTotal([])).toEqual({ total: 0, unpriced: 0 });
  });
});
