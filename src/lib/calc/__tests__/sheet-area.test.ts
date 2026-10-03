import { describe, expect, it } from 'vitest';
import { centerlineLength, sheetArea } from '../sheet-area';
import { centerlineCases, sheetAreaCases } from '../__fixtures__/sheet-area.fixtures';

describe('sheetArea', () => {
  it.each(sheetAreaCases)('$id ($excelCode)', ({ input, area }) => {
    expect(sheetArea(input)).toBeCloseTo(area, 6);
  });
});

describe('centerlineLength', () => {
  it.each(centerlineCases)('$id', ({ input, centerline }) => {
    expect(centerlineLength(input)).toBeCloseTo(centerline, 6);
  });

  it('does not depend on the allowance', () => {
    const base = { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90 } as const;
    expect(centerlineLength({ ...base, allowance: 0 })).toBe(centerlineLength({ ...base, allowance: 80 }));
  });
});
