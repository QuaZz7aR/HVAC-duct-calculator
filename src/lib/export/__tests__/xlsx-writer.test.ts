import { describe, expect, it } from 'vitest';
import { readXlsx } from '../../import/xlsx';
import { workbookParts, writeXlsx } from '../xlsx-writer';

describe('writeXlsx', () => {
  it('is read back by the import reader: text, numbers, empty cells', async () => {
    const bytes = writeXlsx([
      { name: 'Специфікація', rows: [[{ value: 'Деталь', bold: true }, 'Площа, м² <&>'], ['КВд 90°', { value: 1.23456, digits: 3 }], [null, 7]], widths: [30, 12] },
      { name: 'Метал', rows: [['x']] },
    ]);
    expect(await readXlsx(bytes)).toEqual([
      ['Деталь', 'Площа, м² <&>'],
      ['КВд 90°', 1.23456],
      [null, 7],
    ]);
  });

  it('cleans and de-duplicates sheet names, skips non-finite numbers', () => {
    const parts = workbookParts([{ name: 'a/b:c', rows: [[NaN]] }, { name: 'A/B:C', rows: [] }]);
    expect(parts['xl/workbook.xml']).toContain('name="a b c"');
    expect(parts['xl/workbook.xml']).toContain('name="A B C 2"');
    expect(parts['xl/worksheets/sheet1.xml']).not.toContain('NaN');
  });
});
