import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { calculate } from '../calculate';
import { kindOrder } from '../fields';
import { sampleRows } from '../sample-rows';

describe('sample rows', () => {
  const rows = sampleRows(defaultConfig);

  it('has one row of every kind, with unique ids', () => {
    expect(rows.map((r) => r.kind)).toEqual(kindOrder);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('calculates without errors or warnings', () => {
    const out = calculate(rows.map((r) => ({ ...r, flow: '1' })), { temperatureC: '22', pressurePa: '101308' }, defaultConfig);
    for (const row of out.rows) {
      expect(row.ok).toBe(true);
      if (row.ok) expect(row.result.warnings).toEqual([]);
    }
  });

  it('fills the elbow radius from the size', () => {
    expect(rows.find((r) => r.kind === 'roundElbow')?.values.centerRadius).toBe('250');
    expect(rows.find((r) => r.kind === 'rectElbow')?.values.innerRadius).toBe('200');
  });
});
