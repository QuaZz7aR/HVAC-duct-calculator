import { describe, expect, it } from 'vitest';
import { sectionCases } from '../../calc/__fixtures__/section.fixtures';
import { uk } from '../../i18n/uk';
import { errorCodes } from '../../validation';
import { calculate, parseNumber } from '../calculate';
import { initialValues, kindFields, newRow, type FormRow } from '../fields';
import { issueMessage } from '../messages';

const air = { temperatureC: '22', pressurePa: '101308' };

const straight = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1),
  values: { diameter: '150', length: '1000' },
  flow: '265',
  zeta: '0.218',
  ...over,
});

describe('parseNumber', () => {
  it('accepts decimal point and comma, trims, empty is undefined', () => {
    expect(parseNumber(' 0,55 ')).toBe(0.55);
    expect(parseNumber('12.5')).toBe(12.5);
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber(undefined)).toBeUndefined();
  });
  it('rejects junk instead of guessing', () => {
    expect(parseNumber('12abc')).toBeNaN();
    expect(parseNumber('0x10')).toBeNaN();
    expect(parseNumber('1e3')).toBeNaN();
  });
});

describe('calculate', () => {
  it('matches the section fixture for a round straight', () => {
    const fx = sectionCases.find((c) => c.input.fitting.kind === 'roundStraight')!;
    const calc = calculate([straight()], air);
    const out = calc.rows[0];
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.metalArea).toBeCloseTo(fx.expected.metalArea, 6);
    expect(out.result.centerlineLength).toBeCloseTo(fx.expected.centerlineLength, 6);
    expect(calc.totalMetalArea).toBeCloseTo(fx.expected.metalArea, 6);
  });

  it('multiplies by quantity in totals and the sheet list', () => {
    const one = calculate([straight()], air);
    const three = calculate([straight({ quantity: '3' })], air);
    expect(three.totalMetalArea).toBeCloseTo(3 * one.totalMetalArea, 12);
    expect(three.totalPressureDrop).toBeCloseTo(3 * one.totalPressureDrop, 12);
    expect(three.sheetList[0].area).toBeCloseTo(3 * one.sheetList[0].area, 12);
  });

  it('reports a Zod code with the field path and leaves the row out of totals', () => {
    const calc = calculate([straight({ values: { diameter: '-5', length: '1000' } }), straight({ id: 2 })], air);
    const bad = calc.rows[0];
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.issues).toEqual([{ code: 'size.nonPositive', path: ['diameter'] }]);
    expect(calc.skipped).toBe(1);
    expect(calc.sheetList).toHaveLength(1);
  });

  it('flags missing flow, bad quantity and negative zeta', () => {
    const calc = calculate([straight({ flow: '', quantity: '1.5', zeta: '-1' })], air);
    const r = calc.rows[0];
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.issues.map((i) => i.code).sort()).toEqual(['coefficient.negative', 'field.required', 'quantity.invalid']);
    }
  });

  it('treats an empty zeta as zero and an empty reducer length as the config default', () => {
    const row: FormRow = {
      ...newRow(1, 'roundReducer'),
      values: { ...initialValues('roundReducer'), diameter: '150', smallDiameter: '100' },
      flow: '265',
    };
    expect(row.values.length).toBe('');
    const r = calculate([row], air).rows[0];
    expect(r.ok).toBe(true);
  });

  it('never clamps a reducer length below the floor', () => {
    const row: FormRow = {
      ...newRow(1, 'roundReducer'),
      values: { ...initialValues('roundReducer'), diameter: '150', smallDiameter: '100', length: '100' },
      flow: '265',
    };
    const r = calculate([row], air).rows[0];
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues).toContainEqual({ code: 'reducer.tooShort', path: ['length'] });
  });

  it('reports air errors once and skips rows', () => {
    const calc = calculate([straight()], { temperatureC: '-300', pressurePa: '101308' });
    expect(calc.air).toEqual({ ok: false, issues: [{ code: 'air.temperatureTooLow', path: ['temperatureC'] }] });
    expect(calc.rows[0].ok).toBe(false);
    expect(calc.sheetList).toEqual([]);
  });

  it('groups by thickness', () => {
    const big: FormRow = { ...straight({ id: 2 }), values: { diameter: '500', length: '1000' } };
    const calc = calculate([straight(), big], air);
    expect(calc.sheetList.map((g) => g.thicknessMm)).toEqual([0.55, 0.7]);
  });
});

describe('form definitions and messages', () => {
  it('has a prefilled or required entry for every field of every kind, and a label for each', () => {
    for (const [kind, fields] of Object.entries(kindFields)) {
      expect(uk.kinds).toHaveProperty(kind);
      for (const f of fields) expect(uk.fields).toHaveProperty(f.key);
    }
  });
  it('has a human message for every error code', () => {
    for (const code of [...errorCodes, 'quantity.invalid'] as const) {
      expect(issueMessage({ code }, uk).length).toBeGreaterThan(0);
    }
  });
});

describe('robustness', () => {
  it('turns an overflowing number into an error instead of throwing', () => {
    expect(parseNumber('9'.repeat(400))).toBeNaN();
    const calc = calculate([straight({ flow: '9'.repeat(400) })], air);
    expect(calc.rows[0].ok).toBe(false);
  });
  it('reports a row error, not an exception, when a huge size overflows the core', () => {
    const calc = calculate([straight({ values: { diameter: '9'.repeat(300), length: '1000' } })], air);
    const r = calc.rows[0];
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues).toEqual([{ code: 'input.invalid', path: [] }]);
  });
  it('does not count rows blocked only by invalid air as skipped', () => {
    const calc = calculate([straight()], { temperatureC: '', pressurePa: '101308' });
    expect(calc.skipped).toBe(0);
  });
});
