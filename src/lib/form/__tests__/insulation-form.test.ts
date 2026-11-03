import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { insulationArea } from '../../calc/insulation';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const duct = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1),
  values: { diameter: '150', length: '1000' },
  flow: '265',
  ...over,
});

describe('calculate: insulation', () => {
  it('a row without a material has no insulation and the totals are zero', () => {
    const calc = calculate([duct()], air);
    expect(calc.rows[0].ok && calc.rows[0].result.insulation).toBeNull();
    expect(calc.insulationList).toEqual([]);
    expect(calc.totalInsulationArea).toBe(0);
  });

  it('gives the area per piece, times quantity, and the list per material', () => {
    const calc = calculate([duct({ insulation: 'kf10', quantity: '3' }), duct({ id: 2, insulation: 'mf30' })], air);
    const one = insulationArea({ kind: 'roundStraight', diameter: 150, length: 1000 }, 10, defaultConfig);
    const out = calc.rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.insulation).toEqual({ code: 'kf10', area: one, areaTotal: 3 * one });
    expect(calc.insulationList.map((g) => g.code)).toEqual(['kf10', 'mf30']);
    expect(calc.totalInsulationArea).toBeCloseTo(calc.insulationList[0].area + calc.insulationList[1].area, 9);
  });

  it('does not change the metal area', () => {
    const plain = calculate([duct()], air);
    const insulated = calculate([duct({ insulation: 'mf50' })], air);
    expect(insulated.totalMetalArea).toBe(plain.totalMetalArea);
  });

  it('reports an unknown material on the row', () => {
    const calc = calculate([duct({ insulation: 'foam99' })], air);
    expect(calc.rows[0]).toEqual({ ok: false, id: 1, issues: [{ code: 'insulation.unknown', path: ['insulation'] }] });
  });
});
