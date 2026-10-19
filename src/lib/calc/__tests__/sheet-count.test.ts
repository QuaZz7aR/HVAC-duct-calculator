import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../config';
import { orderArea, orderList, sheetCount } from '../sheet-count';

const sheet = { widthMm: 1250, heightMm: 2500 }; // 3.125 m2

describe('orderArea', () => {
  it('adds the margin in percent', () => {
    expect(orderArea(10, 20)).toBeCloseTo(12, 12);
    expect(orderArea(10, 0)).toBe(10);
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('throws on margin %s', (m) => {
    expect(() => orderArea(10, m)).toThrow();
  });
});

describe('sheetCount = ceil(area / sheet area)', () => {
  it.each([
    [0.1, 1],
    [3.125, 1], // exactly one sheet
    [3.126, 2],
    [6.25, 2],
    [9.460075715 * 1.2, 4], // 11.352 / 3.125 = 3.63
  ])('%s m2 -> %s sheets', (area, n) => {
    expect(sheetCount(area, sheet)).toBe(n);
  });
  it('float noise on an exact multiple does not add a sheet', () => {
    expect(sheetCount(3.125 + 1e-13, sheet)).toBe(1);
  });
  it('uses the sheet size', () => {
    expect(sheetCount(4, { widthMm: 1000, heightMm: 2000 })).toBe(2); // 2 m2 sheet
    expect(sheetCount(4, { widthMm: 1500, heightMm: 3000 })).toBe(1); // 4.5 m2 sheet
  });
  it('throws on an invalid sheet', () => {
    expect(() => sheetCount(1, { widthMm: 0, heightMm: 2000 })).toThrow();
  });
});

describe('orderList', () => {
  it('keeps the computed area and adds order area and sheets per thickness', () => {
    const groups = [
      { thicknessMm: 0.5, area: 2 },
      { thicknessMm: 0.7, area: 5 },
    ];
    const lines = orderList(groups, { ...defaultConfig.order, marginPercent: 20, sheet });
    expect(lines.map((l) => l.area)).toEqual([2, 5]);
    expect(lines[0].orderArea).toBeCloseTo(2.4, 12);
    expect(lines[0].sheets).toBe(1);
    expect(lines[1].orderArea).toBeCloseTo(6, 12);
    expect(lines[1].sheets).toBe(2);
  });
  it('the config default is 20 % and 1250 x 2500 among the offered sizes', () => {
    expect(defaultConfig.order.marginPercent).toBe(20);
    expect(defaultConfig.order.sheetSizes).toContainEqual(defaultConfig.order.sheet);
  });
});
