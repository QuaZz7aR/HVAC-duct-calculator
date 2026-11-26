import { describe, expect, it } from 'vitest';
import { layoutTable, type HRule, type Piece, type Rule } from '../pdf';
import { guessMapping, importRows, toFormRows } from '../mapping';
import { defaultConfig } from '../../calc/config';

// a bordered table whose name cell wraps over lines above and below the line with the number and the quantity (ADR 0100)
const p = (x: number, y: number, text: string): Piece => ({ page: 0, x, y, end: x + text.length * 5, size: 10, text });
const cols = [5, 45, 300, 360];
const v = (y0: number, y1: number): Rule[] => cols.map((x) => ({ page: 0, x, y0, y1 }));
const h = (y: number): HRule => ({ page: 0, y, x0: 5, x1: 360 });

const pieces = [
  p(10, 730, '№'), p(50, 730, 'Найменування'), p(305, 730, 'Кількість'),
  p(10, 705, '1'), p(50, 705, 'КВ Д250'), p(305, 705, '4'),
  // row 2: three lines, the anchor in the middle
  p(50, 690, 'Адаптер під дифузор'), p(10, 678, '2'), p(50, 678, '3010х95х220Н, 6 перемичок'), p(305, 678, '2'), p(50, 666, 'з шиберами'),
  // row 3: the name wraps once below the anchor
  p(10, 645, '3'), p(50, 645, 'ПВ 400х200'), p(305, 645, '3'), p(50, 633, 'з сіткою'),
];

describe('wrapped cells in a PDF table', () => {
  it('joins the lines between two row borders into one row and marks it', () => {
    const t = layoutTable(pieces, v(620, 740), [h(740), h(720), h(698), h(657), h(620)]);
    expect(t.filter((r) => r.length)).toEqual([
      ['№', 'Найменування', 'Кількість'],
      ['1', 'КВ Д250', '4'],
      ['2', 'Адаптер під дифузор 3010х95х220Н, 6 перемичок з шиберами', '2'],
      ['3', 'ПВ 400х200 з сіткою', '3'],
    ]);
    const rows = importRows(t, guessMapping(t));
    expect(rows.map((r) => [r.status, r.joined])).toEqual([['ok', undefined], ['ok', 3], ['ok', 2]]);
    const form = toFormRows(rows, 1, defaultConfig);
    expect(form.map((r) => r.joinedLines)).toEqual([undefined, 3, 2]);
  });
  it('joins nothing without row borders, or where a band holds two full lines', () => {
    const plain = layoutTable(pieces, v(620, 740));
    expect(plain.some((r) => r.includes('з сіткою'))).toBe(true);
    // only the outer frame: the whole body is one band with four full lines
    const framed = layoutTable(pieces, v(620, 740), [h(740), h(620)]);
    expect(framed).toEqual(plain);
    expect(importRows(framed, guessMapping(framed)).some((r) => r.joined)).toBe(false);
  });
});
