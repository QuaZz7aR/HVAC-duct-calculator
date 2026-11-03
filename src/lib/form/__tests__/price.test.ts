import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { orderList } from '../../calc/sheet-count';
import { emptyPrices, pricing, priceKey } from '../price';

const calc = {
  sheetList: orderList(
    [
      { thicknessMm: 0.5, area: 10 },
      { thicknessMm: 0.7, area: 5 },
    ],
    defaultConfig.order, // 20 % margin
  ),
  insulationList: [{ code: 'kf13', thicknessMm: 13, area: 4 }],
};

describe('pricing', () => {
  it('prices metal on the area to order and insulation on its computed area', () => {
    const p = pricing(calc, { metal: { [priceKey(0.5)]: '300', [priceKey(0.7)]: '400,5' }, insulation: { kf13: '250' } });
    expect(p.issues).toEqual([]);
    expect(p.metal[0]).toBeCloseTo(12 * 300, 9);
    expect(p.metal[1]).toBeCloseTo(6 * 400.5, 9);
    expect(p.insulation[0]).toBeCloseTo(4 * 250, 9);
    expect(p.metalTotal).toEqual({ total: expect.closeTo(6003, 9), unpriced: 0 });
    expect(p.total.total).toBeCloseTo(7003, 9);
    expect(p.total.unpriced).toBe(0);
  });

  it('empty prices give no cost and count as unpriced, without an issue', () => {
    const p = pricing(calc, emptyPrices());
    expect(p.issues).toEqual([]);
    expect(p.metal).toEqual([undefined, undefined]);
    expect(p.total).toEqual({ total: 0, unpriced: 3 });
  });

  it('a bad price is reported and left unpriced', () => {
    const p = pricing(calc, { metal: { '0.5': 'abc', '0.7': '-1' }, insulation: { kf13: '10000000000' } });
    expect(p.issues).toEqual([
      { code: 'size.notFinite', path: ['metalPrice', '0.5'] },
      { code: 'coefficient.negative', path: ['metalPrice', '0.7'] },
      { code: 'input.invalid', path: ['insulationPrice', 'kf13'] },
    ]);
    expect(p.total).toEqual({ total: 0, unpriced: 3 });
  });

  it('a price kept for a thickness that is no longer in the list is ignored', () => {
    const p = pricing(calc, { metal: { '0.9': '999' }, insulation: {} });
    expect(p.total.total).toBe(0);
  });
});
