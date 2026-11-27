import { describe, expect, it } from 'vitest';
import { recognizeKind } from '../../import/recognize';
import { calculate } from '../calculate';
import { kindFields, newRow, noInsulation, type FormRow } from '../fields';

const air = { temperatureC: '22', pressurePa: '101308' };
const hood = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1, 'rectHood'),
  values: { width: '1000', height: '800', smallWidth: '300', smallHeight: '200', length: '400', skirt: '0', allowance: '50' },
  flow: '500',
  ...over,
});

describe('exhaust hood in the form (BETA, ADR 0120)', () => {
  it('has a rim field prefilled with 0 and no insulation', () => {
    expect(kindFields.rectHood.find((f) => f.key === 'skirt')?.initial).toBe('0');
    expect(noInsulation.has('rectHood') && noInsulation.has('rectHoodRoundStub')).toBe(true);
  });

  it('ignores a material left on the row, so the insulation list stays empty', () => {
    const calc = calculate([hood({ insulation: 'kf13' })], air);
    const r = calc.rows[0];
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.result.insulation).toBeNull();
    expect(calc.totalInsulationArea).toBe(0);
  });

  it('an empty rim counts as no rim, a negative one is an error', () => {
    const area = (row: FormRow) => {
      const r = calculate([row], air).rows[0];
      if (!r.ok) throw new Error(JSON.stringify(r.issues));
      return r.result.metalArea;
    };
    const values = hood().values;
    expect(area(hood({ values: { ...values, skirt: '' } }))).toBeCloseTo(area(hood()), 12);
    // the rim adds the bottom perimeter x its height
    expect(area(hood({ values: { ...values, skirt: '100' } })) - area(hood())).toBeCloseTo(2 * (1 + 0.8) * 0.1, 9);
    const bad = calculate([hood({ values: { ...values, skirt: '-5' } })], air).rows[0];
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.issues.map((i) => i.code)).toContain('skirt.negative');
  });

  it('is imported by its codes, which win over «зонт» in the name; the name alone stays a cap (ADR 0079)', () => {
    expect(recognizeKind('ЗнП', 'Зонт 1000х800', [{ w: 1000, h: 800 }])).toBe('rectHood');
    expect(recognizeKind('ЗНК', 'Зонт 1000х800 + Д250', [{ w: 1000, h: 800 }, { d: 250 }])).toBe('rectHoodRoundStub');
    expect(recognizeKind('RH', undefined, [])).toBe('rectHood');
    expect(recognizeKind(undefined, 'Зонт 810х350х300н', [{ w: 810, h: 350 }])).toBe('rectCap');
  });
});
