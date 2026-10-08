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
