import { describe, expect, it } from 'vitest';
import { sheetAreaCases } from '../../calc/__fixtures__/sheet-area.fixtures';
import { sheetList } from '../../calc/sheet-list';
import { defaultConfig } from '../../calc/config';
import { createSchemas, sheetListItemSchema, sheetListSchema, validate } from '..';

const issues = (schema: Parameters<typeof validate>[0], input: unknown) => {
  const r = validate(schema, input);
  return r.ok ? [] : r.issues;
};

const straight = { kind: 'roundStraight', diameter: 150, length: 1000 };
const item = { fitting: straight, quantity: 2 };

describe('sheet list item', () => {
  it('accepts every fitting fixture with a quantity', () => {
    for (const { input } of sheetAreaCases) {
      expect(validate(sheetListItemSchema, { fitting: input, quantity: 1 }).ok).toBe(true);
    }
  });
  it('accepts a positive integer quantity', () => {
    expect(validate(sheetListItemSchema, item)).toEqual({ ok: true, value: item });
  });
  it.each([0, -1, 1.5, 0.5])('rejects quantity %s with one issue', (quantity) => {
    expect(issues(sheetListItemSchema, { ...item, quantity })).toEqual([{ code: 'quantity.invalid', path: ['quantity'] }]);
  });
  it.each([NaN, Infinity])('rejects non-finite quantity %s', (quantity) => {
    expect(issues(sheetListItemSchema, { ...item, quantity })).toEqual([{ code: 'quantity.invalid', path: ['quantity'] }]);
  });
  it('rejects a text quantity as invalid, like every other field, and a missing one as required', () => {
    expect(issues(sheetListItemSchema, { ...item, quantity: '2' })).toEqual([{ code: 'field.invalid', path: ['quantity'] }]);
    expect(issues(sheetListItemSchema, { fitting: straight })).toEqual([{ code: 'field.required', path: ['quantity'] }]);
  });
  it('reports fitting errors with the path under `fitting`', () => {
    expect(issues(sheetListItemSchema, { ...item, fitting: { ...straight, diameter: 0 } })).toEqual([
      { code: 'size.nonPositive', path: ['fitting', 'diameter'] },
    ]);
  });
  it('reports a fitting and a quantity error together', () => {
    expect(issues(sheetListItemSchema, { fitting: { ...straight, length: -1 }, quantity: 0 })).toEqual([
      { code: 'size.nonPositive', path: ['fitting', 'length'] },
      { code: 'quantity.invalid', path: ['quantity'] },
    ]);
  });
  it('rejects unknown keys', () => {
    expect(issues(sheetListItemSchema, { ...item, price: 1 })).toEqual([{ code: 'input.unknownKey', path: [] }]);
  });
  it('rejects a missing fitting (same code as an unknown kind)', () => {
    expect(issues(sheetListItemSchema, { quantity: 1 })).toEqual([{ code: 'kind.unknown', path: ['fitting'] }]);
  });
});

describe('sheet list', () => {
  it('accepts an empty list and gives indexed paths for errors', () => {
    expect(validate(sheetListSchema, [])).toEqual({ ok: true, value: [] });
    expect(issues(sheetListSchema, [item, { ...item, quantity: 0 }])).toEqual([{ code: 'quantity.invalid', path: [1, 'quantity'] }]);
  });
  it('rejects a non-array', () => {
    expect(issues(sheetListSchema, item)).toEqual([{ code: 'field.invalid', path: [] }]);
  });
  it('validated output goes straight into sheetList', () => {
    const r = validate(sheetListSchema, [item]);
    if (!r.ok) throw new Error('expected a valid list');
    expect(sheetList(r.value, defaultConfig)).toHaveLength(1);
  });
});

describe('createSchemas(config)', () => {
  it('uses the config reducer floor inside list items', () => {
    const { sheetListItem } = createSchemas({ ...defaultConfig, reducerMinLengthMm: 400 });
    const rr = { kind: 'roundReducer', diameter: 150, smallDiameter: 100, length: 300, allowance: 50 };
    expect(issues(sheetListItem, { fitting: rr, quantity: 1 })).toEqual([{ code: 'reducer.tooShort', path: ['fitting', 'length'] }]);
  });
});
