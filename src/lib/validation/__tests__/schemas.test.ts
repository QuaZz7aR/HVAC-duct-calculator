import { describe, expect, it } from 'vitest';
import { aeroCases } from '../../calc/__fixtures__/aero.fixtures';
import { airCases } from '../../calc/__fixtures__/air.fixtures';
import { centerlineCases, sheetAreaCases } from '../../calc/__fixtures__/sheet-area.fixtures';
import { defaultConfig } from '../../calc/config';
import { airInputSchema, ductSectionSchema, fittingSchema, validate } from '..';

const issues = (schema: Parameters<typeof validate>[0], input: unknown) => {
  const r = validate(schema, input);
  return r.ok ? [] : r.issues;
};

describe('fixtures parse', () => {
  it.each(sheetAreaCases)('sheet area $id', ({ input }) => {
    const r = validate(fittingSchema, input);
    expect(r).toEqual({ ok: true, value: input });
  });
  it.each(centerlineCases)('centerline $id', ({ input }) => {
    expect(validate(fittingSchema, input).ok).toBe(true);
  });
  it.each(aeroCases)('section $id', ({ section }) => {
    expect(validate(ductSectionSchema, section)).toEqual({ ok: true, value: section });
  });
  it.each(airCases)('air $id', ({ temperatureC, pressurePa }) => {
    expect(validate(airInputSchema, { temperatureC, pressurePa }).ok).toBe(true);
  });
});

describe('fitting rules', () => {
  const straight = { kind: 'roundStraight', diameter: 150, length: 1000 };
  const elbow = { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50 };
  const rr = { kind: 'roundReducer', diameter: 150, smallDiameter: 100, length: 300, allowance: 50 };
  const rectRed = { kind: 'rectReducer', width: 300, height: 200, smallWidth: 200, smallHeight: 200, length: 300, allowance: 50 };

  it('rejects non-positive size', () => {
    expect(issues(fittingSchema, { ...straight, diameter: 0 })).toEqual([{ code: 'size.nonPositive', path: ['diameter'] }]);
    expect(issues(fittingSchema, { ...straight, length: -5 })).toEqual([{ code: 'size.nonPositive', path: ['length'] }]);
  });
  it('rejects non-finite size', () => {
    expect(issues(fittingSchema, { ...straight, diameter: NaN })).toEqual([{ code: 'size.notFinite', path: ['diameter'] }]);
    expect(issues(fittingSchema, { ...straight, length: Infinity })).toEqual([{ code: 'size.notFinite', path: ['length'] }]);
  });
  it('rejects missing and wrong-type fields', () => {
    expect(issues(fittingSchema, { kind: 'roundStraight', length: 1 })).toEqual([{ code: 'field.required', path: ['diameter'] }]);
    expect(issues(fittingSchema, { ...straight, length: '5' })).toEqual([{ code: 'field.invalid', path: ['length'] }]);
  });
  it('rejects negative allowance, accepts zero', () => {
    expect(issues(fittingSchema, { ...elbow, allowance: -1 })).toEqual([{ code: 'allowance.negative', path: ['allowance'] }]);
    expect(validate(fittingSchema, { ...elbow, allowance: 0 }).ok).toBe(true);
  });
  it('angle must be in (0, 180]', () => {
    expect(issues(fittingSchema, { ...elbow, angle: 0 })).toEqual([{ code: 'angle.outOfRange', path: ['angle'] }]);
    expect(issues(fittingSchema, { ...elbow, angle: 181 })).toEqual([{ code: 'angle.outOfRange', path: ['angle'] }]);
    expect(validate(fittingSchema, { ...elbow, angle: 180 }).ok).toBe(true);
  });
  it('reducer length below the floor is an error, never clamped', () => {
    const below = defaultConfig.reducerMinLengthMm - 1;
    expect(issues(fittingSchema, { ...rr, length: below })).toEqual([{ code: 'reducer.tooShort', path: ['length'] }]);
    expect(validate(fittingSchema, { ...rr, length: defaultConfig.reducerMinLengthMm }).ok).toBe(true);
  });
  it('reducer length defaults to config', () => {
    const { length: _omit, ...noLength } = rr;
    void _omit;
    expect(validate(fittingSchema, noLength)).toEqual({ ok: true, value: { ...rr, length: defaultConfig.reducerLengthMm } });
  });
  it('reducer must change size', () => {
    expect(issues(fittingSchema, { ...rr, smallDiameter: 150 })).toEqual([{ code: 'reducer.noSizeChange', path: ['smallDiameter'] }]);
    expect(issues(fittingSchema, { ...rectRed, smallWidth: 300, smallHeight: 200 })).toEqual([
      { code: 'reducer.noSizeChange', path: ['smallWidth'] },
    ]);
    expect(validate(fittingSchema, rectRed).ok).toBe(true);
  });
  it('rejects unknown kind (tees are out of scope)', () => {
    expect(issues(fittingSchema, { kind: 'tee', width: 1 })).toEqual([{ code: 'kind.unknown', path: ['kind'] }]);
  });
  it('rejects unknown keys', () => {
    expect(issues(fittingSchema, { ...straight, colour: 'red' })).toEqual([{ code: 'input.unknownKey', path: [] }]);
  });
  it('reports several issues with paths', () => {
    expect(issues(fittingSchema, { ...elbow, diameter: 0, angle: 200, allowance: -1 })).toEqual([
      { code: 'size.nonPositive', path: ['diameter'] },
      { code: 'angle.outOfRange', path: ['angle'] },
      { code: 'allowance.negative', path: ['allowance'] },
    ]);
  });
});

describe('section rules', () => {
  const s = { shape: 'round', diameter: 200, flow: 350, length: 1000, localCoefficient: 0.25, roughness: 0.1 };
  it('flow must be positive', () => {
    expect(issues(ductSectionSchema, { ...s, flow: 0 })).toEqual([{ code: 'flow.nonPositive', path: ['flow'] }]);
  });
  it('coefficient must not be negative', () => {
    expect(issues(ductSectionSchema, { ...s, localCoefficient: -0.1 })).toEqual([{ code: 'coefficient.negative', path: ['localCoefficient'] }]);
  });
  it('roughness must not be negative, zero is fine', () => {
    expect(issues(ductSectionSchema, { ...s, roughness: -1 })).toEqual([{ code: 'roughness.negative', path: ['roughness'] }]);
    expect(validate(ductSectionSchema, { ...s, roughness: 0 }).ok).toBe(true);
  });
  it('rect section sizes must be positive', () => {
    const r = { shape: 'rect', width: 0, height: 100, flow: 1, length: 1, localCoefficient: 0, roughness: 0.1 };
    expect(issues(ductSectionSchema, r)).toEqual([{ code: 'size.nonPositive', path: ['width'] }]);
  });
  it('rejects unknown shape', () => {
    expect(issues(ductSectionSchema, { ...s, shape: 'oval' })).toEqual([{ code: 'kind.unknown', path: ['shape'] }]);
  });
});

describe('air rules', () => {
  it('temperature must be above absolute zero (from config)', () => {
    const t = -defaultConfig.air.zeroCelsiusK;
    expect(issues(airInputSchema, { temperatureC: t, pressurePa: 101325 })).toEqual([
      { code: 'air.temperatureTooLow', path: ['temperatureC'] },
    ]);
  });
  it('pressure must be positive', () => {
    expect(issues(airInputSchema, { temperatureC: 20, pressurePa: 0 })).toEqual([
      { code: 'air.pressureNonPositive', path: ['pressurePa'] },
    ]);
  });
  it('non-finite air values are rejected', () => {
    expect(issues(airInputSchema, { temperatureC: NaN, pressurePa: 101325 })).toEqual([
      { code: 'field.invalid', path: ['temperatureC'] },
    ]);
  });
});
