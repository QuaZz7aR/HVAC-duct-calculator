import { describe, expect, it } from 'vitest';
import { centerlineLength, sheetArea } from '../sheet-area';
import type { Fitting } from '../types';
import { allowanceCountCases } from '../__fixtures__/allowance-count.fixtures';

describe('number of allowances', () => {
  it.each(allowanceCountCases)('$id', ({ input, area }) => {
    expect(sheetArea(input)).toBeCloseTo(area, 6);
  });

  it('absent means 2', () => {
    const base: Fitting = { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50 };
    expect(sheetArea(base)).toBeCloseTo(sheetArea({ ...base, allowanceCount: 2 }), 12);
  });

  it('never changes the centre line', () => {
    const base: Fitting = { kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50 };
    expect(centerlineLength({ ...base, allowanceCount: 0 })).toBe(centerlineLength(base));
  });
});
