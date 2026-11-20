import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { setFieldValue } from '../../form/auto-defaults';
import { guessMapping, importRows, toFormRows } from '../mapping';
import type { Table } from '../xlsx';

// a name with sizes next to size columns that disagree with it (ADR 0073)
const table: Table = [
  ['Найменування', 'Ширина', 'Висота', 'Довжина, мм', 'Кількість'],
  ['Повітропровід 400х200', 500, 200, 1000, 1],
  ['Повітропровід 300х200', 300, 200, 1000, 2],
];

describe('size conflicts between the name and the columns (ADR 0073)', () => {
  const rows = importRows(table, guessMapping(table));

  it('flags only the field that differs, and the column wins', () => {
    expect(rows[0].status).toBe('ok');
    expect(rows[0].conflicts).toEqual([{ field: 'width', name: '400', column: '500' }]);
    expect(rows[0].values.width).toBe('500');
    expect(rows[1].conflicts).toBeUndefined();
  });

  it('carries the conflict to the form row until the field is edited', () => {
    const [first, second] = toFormRows(rows, 1, defaultConfig);
    expect(first.sizeConflicts).toEqual([{ field: 'width', name: '400', column: '500' }]);
    expect(second.sizeConflicts).toBeUndefined();
    expect(setFieldValue(first, 'height', '250', defaultConfig).sizeConflicts).toHaveLength(1);
    expect(setFieldValue(first, 'width', '400', defaultConfig).sizeConflicts).toBeUndefined();
  });
});
