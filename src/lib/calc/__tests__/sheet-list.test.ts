import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { sheetList } from '../sheet-list';
import { thickness, thicknessSize } from '../thickness';
import { sheetListCases, thicknessSizeCases } from '../__fixtures__/sheet-list.fixtures';

describe('thicknessSize', () => {
  it.each(thicknessSizeCases)('$id', ({ fitting, size, thickness: expected }) => {
    expect(thicknessSize(fitting)).toEqual(size);
    expect(thickness(thicknessSize(fitting), defaultConfig)).toBe(expected);
  });
});

describe('thicknessSize reducers take the max over both ends', () => {
  it('rect reducer whose small end is wider on one side', () => {
    const fitting = { kind: 'rectReducer', width: 300, height: 200, smallWidth: 350, smallHeight: 150, length: 300, allowance: 50 } as const;
    expect(thicknessSize(fitting)).toEqual({ shape: 'rect', width: 350, height: 200 });
  });

  it('rect reducer where the small end alone crosses the threshold', () => {
    const fitting = { kind: 'rectReducer', width: 300, height: 200, smallWidth: 400, smallHeight: 100, length: 300, allowance: 50 } as const;
    expect(thickness(thicknessSize(fitting), defaultConfig)).toBe(0.7);
  });

  it('round reducer with swapped ends', () => {
    const fitting = { kind: 'roundReducer', diameter: 300, smallDiameter: 400, length: 300, allowance: 50 } as const;
    expect(thicknessSize(fitting)).toEqual({ shape: 'round', diameter: 400 });
  });
});

describe('sheetList', () => {
  it.each(sheetListCases)('$id', ({ items, expected }) => {
    const result = sheetList(items, defaultConfig);
    expect(result).toHaveLength(expected.length);
    result.forEach((group, i) => {
      expect(group.thicknessMm).toBe(expected[i].thicknessMm);
      expect(group.area).toBeCloseTo(expected[i].area, 6);
    });
  });

  it.each([0, -1, 1.5, Number.NaN])('throws on invalid quantity %s', (quantity) => {
    const items = [{ fitting: { kind: 'roundStraight', diameter: 150, length: 1000 } as const, quantity }];
    expect(() => sheetList(items, defaultConfig)).toThrow();
  });
});
