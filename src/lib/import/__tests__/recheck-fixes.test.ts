import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { guessMapping, importRows, toFormRows } from '../mapping';
import { parseName, recognizeKind } from '../recognize';
import type { Table } from '../xlsx';

// fixes found by the full recheck of 2026-11-26 (ADR 0115)
describe('import fixes (ADR 0115)', () => {
  it('leaves an unreadable quantity («###») empty and flags it, never 1', () => {
    const table: Table = [
      ['Найменування', 'Ширина', 'Висота', 'Довжина, м', 'Кількість'],
      ['Повітропровід 300х200', 300, 200, 1.25, '###'],
      ['Повітропровід 300х200', 300, 200, 1.25, 4],
    ];
    const [bad, good] = importRows(table, guessMapping(table));
    expect(bad.status).toBe('ok');
    expect(bad.quantity).toBe('');
    expect(bad.quantityUnreadable).toBe(true);
    expect(good.quantity).toBe('4');
    expect(good.quantityUnreadable).toBeUndefined();
    expect(toFormRows([bad], 1, defaultConfig)[0].quantity).toBe('');
  });

  it('reads a slot adapter «3010х95х220Н, 6 перемычек» as a box: length = the longest size, partitions from the name', () => {
    const name = 'Адаптер под щелевой диффузор 3010х95х220Н, 6 перемычек на расстоянии 500 мм друг от друга, 2 Врезки Д150';
    const p = parseName(name);
    expect(p.sizes[0]).toEqual({ w: 95, h: 220 });
    expect(p.length).toBe(3010);
    expect(p.partitions).toBe(6);
    expect(recognizeKind(undefined, name, p.sizes)).toBe('rectBox');
    const table: Table = [['№', 'Наименование', 'Длина, мм', 'Кол-во, шт'], [1, name, '', 2]];
    const [row] = importRows(table, guessMapping(table));
    expect(row.kind).toBe('rectBox');
    expect(row.values).toMatchObject({ width: '95', height: '220', length: '3010', partitions: '6' });
  });

  it('still leaves a diffuser or a grille alone unrecognised', () => {
    expect(recognizeKind(undefined, 'Щелевой диффузор 1000х100', parseName('Щелевой диффузор 1000х100').sizes)).toBeUndefined();
  });

  it('never reads a flexible duct as a straight', () => {
    expect(recognizeKind('ГВ', 'Гнучкий повітропровід', [{ d: 200 }])).toBeUndefined();
    expect(recognizeKind(undefined, 'Гибкий воздуховод Д200', [{ d: 200 }])).toBeUndefined();
    expect(recognizeKind(undefined, 'Повітропровід Д200', [{ d: 200 }])).toBe('roundStraight');
  });
});
