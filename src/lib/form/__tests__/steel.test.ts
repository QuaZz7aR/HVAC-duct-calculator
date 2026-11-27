import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';
import { pricing, priceKey } from '../price';
import { parseProject, serializeProject } from '../project-store';
import { defaultSettings } from '../settings';
import { toSteel } from '../steel';

const air = { temperatureC: '20', pressurePa: '101325' };
const straight = (id: number, over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(id),
  values: { diameter: '150', length: '1000' },
  flow: '265',
  zeta: '',
  ...over,
});

describe('steel type (ADR 0120)', () => {
  it('unknown or empty is galvanized', () => {
    expect(toSteel(undefined)).toBe('galvanized');
    expect(toSteel('')).toBe('galvanized');
    expect(toSteel('gold')).toBe('galvanized');
    expect(toSteel('stainless')).toBe('stainless');
  });

  it('galvanized rows give the same sheet list as before, with no steel on the lines', () => {
    const calc = calculate([straight(1), straight(2, { steel: 'galvanized' })], air);
    expect(calc.sheetList).toHaveLength(1);
    expect(calc.sheetList[0].steel).toBeUndefined();
  });

  it('splits the sheet list by steel, galvanized first, same totals', () => {
    const both = calculate([straight(1, { steel: 'stainless' }), straight(2)], air);
    const one = calculate([straight(1), straight(2)], air);
    expect(both.sheetList.map((l) => [l.steel, l.thicknessMm])).toEqual([[undefined, 0.5], ['stainless', 0.5]]);
    expect(both.sheetList[0].area).toBeCloseTo(one.sheetList[0].area / 2, 12);
    expect(both.totalMetalConsumption).toBeCloseTo(one.totalMetalConsumption, 12);
    expect(both.rows.map((r) => r.ok && r.result.steel)).toEqual(['stainless', 'galvanized']);
  });

  it('prices each steel by its own key', () => {
    const calc = calculate([straight(1, { steel: 'stainless' }), straight(2)], air);
    const p = pricing(calc, { metal: { [priceKey(0.5)]: '100', [priceKey(0.5, 'stainless')]: '500' }, insulation: {} });
    expect(priceKey(0.5, 'stainless')).toBe('stainless:0.5');
    expect(priceKey(0.5, 'galvanized')).toBe('0.5');
    expect(p.metal[0]).toBeCloseTo(calc.sheetList[0].orderArea * 100, 9);
    expect(p.metal[1]).toBeCloseTo(calc.sheetList[1].orderArea * 500, 9);
  });

  it('is saved with the project', () => {
    const rows = [straight(1, { steel: 'black' })];
    const text = serializeProject({ rows, settings: defaultSettings(), prices: { metal: {}, insulation: {} } });
    expect(parseProject(text)?.rows[0].steel).toBe('black');
  });
});
