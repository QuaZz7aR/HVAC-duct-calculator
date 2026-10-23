import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { setFieldValue } from '../auto-defaults';
import { calculate } from '../calculate';
import { defaultValues, presetRow } from '../defaults';
import { kindFields, kindOrder } from '../fields';

describe('default values', () => {
  it('fill every required field of every kind', () => {
    for (const kind of kindOrder) {
      for (const f of kindFields[kind]) {
        if (!f.optional && f.key !== 'centerRadius' && f.key !== 'innerRadius') expect(defaultValues(kind)[f.key], `${kind}.${f.key}`).toBeTruthy();
      }
    }
  });

  it('give a row that calculates without errors or warnings', () => {
    for (const kind of kindOrder) {
      const row = presetRow(1, kind, defaultConfig);
      const out = calculate([{ ...row, flow: '1' }], { temperatureC: '22', pressurePa: '101308' }, defaultConfig);
      expect(out.rows[0].ok, kind).toBe(true);
      if (out.rows[0].ok) expect(out.rows[0].result.warnings, kind).toEqual([]);
    }
  });

  it('mark the row as preset until a field is edited', () => {
    const row = presetRow(1, 'roundStraight', defaultConfig);
    expect(row.preset).toBe(true);
    expect(setFieldValue(row, 'length', '2000', defaultConfig).preset).toBe(false);
  });
});
