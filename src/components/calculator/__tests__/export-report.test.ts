import { describe, expect, it } from 'vitest';
import { defaultConfig } from '@/lib/calc/config';
import { calculate, type RowOutcome } from '@/lib/form/calculate';
import { pricing } from '@/lib/form/price';
import { sampleRows } from '@/lib/form/sample-rows';
import { defaultSettings } from '@/lib/form/settings';
import { dictionaries } from '@/lib/i18n';
import { reportSheets } from '../export-report';

const air = { temperatureC: '20', pressurePa: '101325' };

function input(withInsulation: boolean, metalPrice?: string) {
  const rows = sampleRows(defaultConfig).map((r, i) => ({ ...r, flow: '1', insulation: withInsulation && i === 0 ? 'kf10' : undefined }));
  const calc = calculate(rows, air, defaultConfig);
  const outcomes = new Map<number, RowOutcome>(calc.rows.map((r) => [r.ok ? r.result.id : r.id, r]));
  const key = String(calc.sheetList[0].thicknessMm);
  const costs = pricing(calc, { metal: metalPrice ? { [key]: metalPrice } : {}, insulation: {} });
  return { rows, outcome: (id: number) => outcomes.get(id), calc, pricing: costs, settings: defaultSettings(), date: new Date(2026, 10, 24) };
}

describe('reportSheets', () => {
  it('lists every row with the page numbers and the totals', () => {
    const inp = input(false);
    const [spec, metal, ...rest] = reportSheets(inp, dictionaries.uk);
    expect(rest).toHaveLength(0); // no insulation picked = no insulation sheet
    expect(spec.name).toBe('Специфікація');
    const first = inp.calc.rows[0];
    if (!first.ok) throw new Error('sample row failed');
    const line = spec.rows[4];
    expect(line[0]).toBe('1');
    expect(line[6]).toEqual({ value: first.result.metalAreaTotal, digits: 3 });
    expect(spec.rows.slice(4, 4 + inp.rows.length)).toHaveLength(inp.rows.length);
    const flat = JSON.stringify(spec.rows);
    expect(flat).toContain(String(inp.calc.totalMetalAreaToOrder));
    expect(flat).not.toContain('Вартість металу'); // no prices typed
    expect(metal.rows.at(-3)?.[3]).toEqual({ value: inp.calc.sheetList.reduce((s, l) => s + l.sheets, 0), bold: true, digits: 0 });
  });

  it('adds the insulation sheet and the price columns when they have content', () => {
    const inp = input(true, '300');
    const sheets = reportSheets(inp, dictionaries.en);
    expect(sheets.map((s) => s.name)).toEqual(['Specification', 'Metal', 'Insulation']);
    expect(sheets[1].rows[3]).toContainEqual({ value: 'Cost, UAH', bold: true, digits: undefined });
    expect(sheets[1].rows[4][4]).toEqual({ value: inp.pricing.metal[0], digits: 2 });
  });
});
