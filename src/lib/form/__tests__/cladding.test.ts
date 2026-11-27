import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { claddingArea, insulationArea } from '../../calc/insulation';
import { calculate } from '../calculate';
import { newRow, type FormRow } from '../fields';
import { emptyPrices, pricing } from '../price';
import { parseProject, serializeProject } from '../project-store';
import { defaultSettings } from '../settings';

const air = { temperatureC: '22', pressurePa: '101308' };
const duct = (over: Partial<FormRow> = {}): FormRow => ({
  ...newRow(1),
  values: { diameter: '150', length: '1000' },
  flow: '265',
  ...over,
});
const straight = { kind: 'roundStraight', diameter: 150, length: 1000 } as const;
const elbow = { kind: 'rectElbow', width: 400, height: 200, innerRadius: 200, angle: 90, allowance: 0 } as const;

describe('claddingArea (ADR 0120)', () => {
  it('is the outer surface of the insulation when there is no overlap', () => {
    expect(claddingArea(straight, 30, defaultConfig)).toBe(insulationArea(straight, 30, defaultConfig));
    expect(claddingArea(elbow, 50, defaultConfig)).toBe(insulationArea(elbow, 50, defaultConfig));
  });

  it('adds the configured overlap', () => {
    const config = { ...defaultConfig, cladding: { overlapPercent: 10 } };
    expect(claddingArea(straight, 30, config)).toBeCloseTo(1.1 * insulationArea(straight, 30, config), 12);
  });
});

describe('calculate: cladding', () => {
  it('is off by default', () => {
    const calc = calculate([duct({ insulation: 'mf50' })], air);
    expect(calc.rows[0].ok && calc.rows[0].result.cladding).toBeNull();
    expect(calc.totalCladdingArea).toBe(0);
  });

  it('gives the area per piece and the total, without changing metal or insulation', () => {
    const plain = calculate([duct({ insulation: 'mf50', quantity: '2' })], air);
    const calc = calculate([duct({ insulation: 'mf50', quantity: '2', cladding: '1' })], air);
    const one = claddingArea(straight, 50, defaultConfig);
    const out = calc.rows[0];
    expect(out.ok && out.result.cladding).toEqual({ area: one, areaTotal: 2 * one });
    expect(calc.totalCladdingArea).toBe(2 * one);
    expect(calc.totalMetalArea).toBe(plain.totalMetalArea);
    expect(calc.totalInsulationArea).toBe(plain.totalInsulationArea);
  });

  it('needs an insulation material', () => {
    const calc = calculate([duct({ cladding: '1' })], air);
    expect(calc.rows[0]).toEqual({ ok: false, id: 1, issues: [{ code: 'cladding.noInsulation', path: ['cladding'] }] });
  });

  it('is priced as one line and counted in the total', () => {
    const calc = calculate([duct({ insulation: 'mf50', cladding: '1' })], air);
    const unpriced = pricing(calc, emptyPrices());
    expect(unpriced.claddingLines).toBe(1);
    expect(unpriced.cladding).toBeUndefined();
    expect(unpriced.total.unpriced).toBe(3);
    const priced = pricing(calc, { ...emptyPrices(), cladding: '200' });
    expect(priced.cladding).toBeCloseTo(200 * calc.totalCladdingArea, 9);
    expect(priced.total.total).toBeCloseTo(200 * calc.totalCladdingArea, 9);
    expect(pricing(calc, { ...emptyPrices(), cladding: 'x' }).issues).toEqual([{ code: 'size.notFinite', path: ['claddingPrice'] }]);
  });

  it('has no line without cladding', () => {
    const p = pricing(calculate([duct({ insulation: 'mf50' })], air), { ...emptyPrices(), cladding: '200' });
    expect(p.claddingLines).toBe(0);
    expect(p.cladding).toBeUndefined();
  });

  it('is saved and read back with the project', () => {
    const rows = [duct({ insulation: 'mf50', cladding: '1' })];
    const back = parseProject(serializeProject({ rows, settings: defaultSettings(), prices: { ...emptyPrices(), cladding: '150' } }));
    expect(back?.rows[0].cladding).toBe('1');
    expect(back?.prices.cladding).toBe('150');
  });
});
