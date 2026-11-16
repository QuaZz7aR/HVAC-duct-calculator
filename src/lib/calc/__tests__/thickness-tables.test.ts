import { describe, expect, it } from 'vitest';
import { defaultConfig, engineerThickness, dbnThickness } from '../config';
import { thickness } from '../thickness';

const withTable = (thickness: typeof dbnThickness) => ({ ...defaultConfig, thickness });

describe('engineer thickness table (option)', () => {
  const config = withTable(engineerThickness);
  it.each([
    [{ shape: 'round', diameter: 399 }, 0.55],
    [{ shape: 'round', diameter: 400 }, 0.7],
    // rect by the equivalent diameter 2AB/(A+B) (ADR 0041)
    [{ shape: 'rect', width: 300, height: 200 }, 0.55], // 240
    [{ shape: 'rect', width: 300, height: 400 }, 0.55], // 342.9; by the larger side it was 0.7
    [{ shape: 'rect', width: 500, height: 200 }, 0.55], // 285.7
    [{ shape: 'rect', width: 1000, height: 250 }, 0.7], // 400, band start inclusive
    [{ shape: 'rect', width: 400, height: 400 }, 0.7], // 400
  ] as const)('%j -> %s', (size, expected) => {
    expect(thickness(size, config)).toBe(expected);
  });
});

describe('thickness tables', () => {
  it('the default is the ДБН table, with exclusive band starts', () => {
    expect(defaultConfig.thickness).toBe(dbnThickness);
    expect(dbnThickness.bandStart).toBe('exclusive');
    expect(engineerThickness.bandStart).toBe('inclusive');
  });
  it('tables are ascending from 0 and have a version', () => {
    for (const t of [dbnThickness, engineerThickness]) {
      expect(t.version.length).toBeGreaterThan(0);
      for (const rows of [t.round, t.rect]) {
        expect(rows[0].fromMm).toBe(0);
        rows.slice(1).forEach((r, i) => expect(r.fromMm).toBeGreaterThan(rows[i].fromMm));
      }
    }
  });
  it('a size below every row of an exclusive table is an error, not a silent default', () => {
    const odd = { ...dbnThickness, round: [{ fromMm: 100, thicknessMm: 1 }] };
    expect(() => thickness({ shape: 'round', diameter: 100 }, withTable(odd))).toThrow();
  });
});
