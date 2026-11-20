import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { setFieldValue } from '../../form/auto-defaults';
import { guessMapping, importRows, toFormRows, withKind } from '../mapping';
import type { Table } from '../xlsx';

// a recognised row with no size anywhere is added with a warning, not filled silently (ADR 0074)
const table: Table = [
  ['Найменування', 'Ширина', 'Висота', 'Довжина, мм', 'Кількість'],
  ['Круглий повітропровід', '', '', '', 1],
  ['Повітропровід 300х200', 300, 200, 1000, 2],
];

describe('rows without sizes (ADR 0074)', () => {
  const read = importRows(table, guessMapping(table));
  // the first row is not recognised without sizes; the user picks its kind, as in the dialog
  const rows = [withKind(read[0], 'roundStraight'), read[1]];

  it('marks only the row without sizes and clears the mark on the first edit', () => {
    const [empty, full] = toFormRows(rows, 1, defaultConfig);
    expect(empty.noSizes).toBe(true);
    expect(full.noSizes).toBeUndefined();
    expect(setFieldValue(empty, 'diameter', '200', defaultConfig).noSizes).toBeUndefined();
  });
});
