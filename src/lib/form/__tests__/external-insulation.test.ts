import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { insulationArea } from '../../calc/insulation';
import { calculate } from '../calculate';
import type { FormRow } from '../fields';
import { parseProject, projectVersion } from '../project-store';

const air = { temperatureC: '22', pressurePa: '101308' };
const duct = (over: Partial<FormRow> = {}): FormRow => ({
  id: 1, kind: 'roundStraight', values: { diameter: '150', length: '1000' }, quantity: '1', flow: '500', zeta: '', ...over,
});

describe('external insulation by thickness (ADR 0120)', () => {
  it('a typed thickness is a line «ext<mm>» with the same area as the old material of that thickness', () => {
    const calc = calculate([duct({ insulation: '25', quantity: '2' }), duct({ id: 2, insulation: '13' }), duct({ id: 3, insulation: 'kf13' })], air);
    const one = insulationArea({ kind: 'roundStraight', diameter: 150, length: 1000 }, 25, defaultConfig);
    const r = calc.rows[0];
    expect(r.ok && r.result.insulation).toEqual({ code: 'ext25', area: one, areaTotal: 2 * one });
    expect(calc.insulationList.map((g) => g.code)).toEqual(['kf13', 'ext13', 'ext25']);
    expect(calc.insulationList[1].area).toBeCloseTo(calc.insulationList[0].area, 12);
  });

  it('accepts a decimal comma and refuses zero, text and over 200 mm', () => {
    expect(calculate([duct({ insulation: '9,5' })], air).insulationList[0]).toMatchObject({ code: 'ext9.5', thicknessMm: 9.5 });
    for (const bad of ['0', 'abc', '250', '-5']) {
      expect(calculate([duct({ insulation: bad })], air).rows[0]).toMatchObject({ ok: false, issues: [{ code: 'insulation.unknown' }] });
    }
  });

  it('a saved material code is read as its thickness, prices move to the thickness line', () => {
    const p = parseProject(JSON.stringify({
      version: projectVersion,
      rows: [{ id: 1, kind: 'roundStraight', values: {}, quantity: '1', insulation: 'mf30' }],
      prices: { metal: {}, insulation: { kf30: '100', mf30: '200', iz8: '50' } },
    }))!;
    expect(p.rows[0].insulation).toBe('30');
    expect(p.prices.insulation).toEqual({ ext30: '100', ext8: '50' });
  });
});
