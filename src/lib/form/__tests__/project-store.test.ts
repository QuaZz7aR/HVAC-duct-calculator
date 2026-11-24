import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { parseProject, projectVersion, serializeProject } from '../project-store';
import { sampleRows } from '../sample-rows';
import { defaultSettings } from '../settings';

const settings = { ...defaultSettings(), thicknessTable: 'engineer' as const, marginPercent: '15' };
const prices = { metal: { '0.5': '320' }, insulation: { K: '150' } };

describe('project store', () => {
  it('reads back what it saved: rows in order, positions, settings, prices', () => {
    const rows = sampleRows(defaultConfig).map((r, i) => ({ ...r, position: i === 0 ? 'П1' : undefined, preset: false }));
    rows.reverse();
    const back = parseProject(serializeProject({ rows, settings, prices }));
    expect(back?.rows.map((r) => r.id)).toEqual(rows.map((r) => r.id));
    expect(back?.rows.map((r) => r.values)).toEqual(rows.map((r) => r.values));
    expect(back?.rows.find((r) => r.position === 'П1')?.id).toBe(rows.at(-1)?.id);
    expect(back?.settings).toEqual(settings);
    expect(back?.prices).toEqual(prices);
  });

  it('keeps an empty list as empty', () => {
    expect(parseProject(serializeProject({ rows: [], settings, prices }))?.rows).toEqual([]);
  });

  it('reads nothing from missing, broken or other-version data', () => {
    expect(parseProject(null)).toBeUndefined();
    expect(parseProject('{oops')).toBeUndefined();
    expect(parseProject(JSON.stringify({ version: projectVersion + 1, rows: [] }))).toBeUndefined();
    expect(parseProject(JSON.stringify({ version: projectVersion, rows: 'x' }))).toBeUndefined();
  });

  it('skips broken rows and repairs bad settings and prices', () => {
    const text = JSON.stringify({
      version: projectVersion,
      rows: [
        { id: 1, kind: 'nope', values: {} },
        { id: 'x', kind: 'roundStraight' },
        { id: 2, kind: 'roundStraight', values: { diameter: '200', bogus: '1', length: 5 }, manual: ['bogus'], quantity: 3 },
        { id: 2, kind: 'roundStraight', values: {} },
      ],
      settings: { thicknessTable: 'mine', seamPercent: '5', sheet: '1x1' },
      prices: { metal: { '0.5': 7, '0.7': '400' } },
    });
    const p = parseProject(text)!;
    expect(p.rows).toHaveLength(1);
    expect(p.rows[0].values.diameter).toBe('200');
    expect(p.rows[0].values).not.toHaveProperty('bogus');
    expect(p.rows[0].quantity).toBe('1');
    expect(p.rows[0].manual).toEqual([]);
    expect(p.settings).toEqual({ ...defaultSettings(), seamPercent: '5' });
    expect(p.prices).toEqual({ metal: { '0.7': '400' }, insulation: {} });
  });
});
