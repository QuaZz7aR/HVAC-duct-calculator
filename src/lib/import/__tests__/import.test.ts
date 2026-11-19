import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../calc/config';
import { guessMapping, importRows, toFormRows, withKind } from '../mapping';
import { parseName, recognizeKind } from '../recognize';
import { readCsv, readXlsx, type Table } from '../xlsx';

describe('recognizeKind', () => {
  it('reads the engineer codes, this site designations and look-alike Latin letters', () => {
    expect(recognizeKind('КВ', undefined, [])).toBe('roundStraight');
    expect(recognizeKind('ПО', undefined, [])).toBe('rectElbow');
    expect(recognizeKind('КККр', undefined, [])).toBe('roundCross');
    expect(recognizeKind('Кніп', undefined, [])).toBe('roundStraight');
    expect(recognizeKind('КВд', undefined, [])).toBe('roundElbow');
    expect(recognizeKind('KB', undefined, [])).toBe('roundStraight');
    expect(recognizeKind('CRT', undefined, [])).toBe('roundTeeRectBranch');
  });
  it('takes a code at the start of a name, or a family word resolved by the sizes', () => {
    const k = (name: string) => recognizeKind(undefined, name, parseName(name).sizes);
    expect(k('КО 90 Д150')).toBe('roundElbow');
    expect(k('ППК Д200/400х200, тип 4')).toBe('rectToRoundReducer');
    expect(k('Заглушка Д160')).toBe('roundCap');
    expect(k('Врезка 300х100')).toBe('rectTap');
    expect(k('Круглий трійник Ø250/Ø150')).toBe('roundTee');
    expect(k('Тройник 500х300/Д200')).toBe('rectTeeRoundBranch');
    expect(k('Переход 400х200/300х200')).toBe('rectReducer');
  });
  it('does not guess parts it does not compute', () => {
    const k = (name: string) => recognizeKind(undefined, name, parseName(name).sizes);
    expect(k('Утка 200х400об, подъем на 120мм')).toBeUndefined();
    expect(k('Приточный адаптер 660х153, 2 врезки Д150')).toBeUndefined();
    expect(k('Итого прямиков')).toBeUndefined();
  });
});

describe('parseName', () => {
  it('reads sizes, angle and length', () => {
    expect(parseName('КО 45 Д150')).toEqual({ sizes: [{ d: 150 }], angle: 45 });
    expect(parseName('550х350/500х300 l150мм')).toEqual({ sizes: [{ w: 550, h: 350 }, { w: 500, h: 300 }], length: 150 });
    expect(parseName('Ø200 90°').angle).toBe(90);
  });
  it('reads a bare second diameter and a capital X, and no angle from a type number', () => {
    expect(parseName('Переход Д200/160').sizes).toEqual([{ d: 200 }, { d: 160 }]);
    expect(parseName('ППК Д200/400х200').sizes).toEqual([{ d: 200 }, { w: 400, h: 200 }]);
    expect(parseName('Повітропровід 400X200').sizes).toEqual([{ w: 400, h: 200 }]);
    expect(parseName('ПО 400х200 тип 4').angle).toBeUndefined();
  });
});

// the engineer's template: system, number, note, code, then the size columns; the header lacks the code column (a real file)
const template: Table = [
  ['Столбец1', 'Столбец2', 'Примітки', 'Ширина, або діаметр, А, мм', 'Висота, B, мм', 'Менша ширина, або діаметр, a, мм', 'Менша висота, b, мм', 'Припуск або довжина врізки, l, мм', 'Радіус деталі, R, мм', 'Кут відводу, α', 'Довжина, м', 'Кількість, шт', 'Товщина'],
  ['ПВ1П', 1, '550х350', 'ПВ', 550, 300, '-', '-', '-', '-', '-', 1.25, 7, '0,55'],
  ['ПВ1П', 7, '300х500об', 'ПО', 300, 500, '-', '-', 50, 125, 90, 0.53, 2, '0,55'],
  ['ПВ1П', 11, 'l150мм', 'ПП', 550, 350, 500, 300, 50, '-', '-', 0.15, 1, '0,55'],
  ['П2', 36, 'Кругла врізка', 'Квр', 200, '-', '-', '-', 50, '-', '-', 0.1, 1, '0,55'],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, '0,55'],
];

// a free-text spec: the name holds code and sizes, systems are heading rows, lengths in mm
const freeText: Table = [
  ['№', 'Наименование ', 'Длина, мм', 'Кол-во, шт', 'площадь,м2'],
  ['ПВ1'],
  [1, 'КВ Д150', 1000, 32, 0.5],
  [6, 'КО 90 Д150', null, 9, 0.21],
  [14, 'Утка 200х400об, подъем на 120мм', 350, 1, 0.56],
  ['Итого прямиков/фасонины', 61.57],
  ['В1'],
  [25, 'КП Д150/Д100', 150, 2, 0.1],
];

describe('guessMapping and importRows', () => {
  it('maps the template, moving the size columns under their data', () => {
    const m = guessMapping(template);
    expect(m.header).toBe(0);
    expect(m.columns).toMatchObject({ system: 0, position: 1, name: 2, code: 3, A: 4, B: 5, l: 8, R: 9, angle: 10, L: 11, quantity: 12 });
    expect(m.lengthUnit).toBe('m');
    const rows = importRows(template, m);
    expect(rows.map((r) => r.status)).toEqual(['ok', 'ok', 'ok', 'ok', 'skip']);
    expect(rows[0]).toMatchObject({ kind: 'rectStraight', values: { width: '550', height: '300', length: '1250' }, quantity: '7', position: 'ПВ1П-1' });
    // an elbow ignores the computed «Довжина»
    expect(rows[1].values).toEqual({ width: '300', height: '500', allowance: '50', innerRadius: '125', angle: '90' });
    expect(rows[2].values).toMatchObject({ smallWidth: '500', smallHeight: '300', length: '150' });
    // a tap takes L as its stub length, the Excel's l (ring width) is not a field
    expect(rows[3]).toMatchObject({ kind: 'roundTap', values: { diameter: '200', length: '100' } });
  });
  it('reads a free-text spec: headings name the system, totals are skipped, unknown parts are kept for a choice', () => {
    const m = guessMapping(freeText);
    expect(m.columns).toMatchObject({ position: 0, name: 1, L: 2, quantity: 3 });
    expect(m.lengthUnit).toBe('mm');
    const rows = importRows(freeText, m);
    expect(rows.map((r) => r.status)).toEqual(['skip', 'ok', 'ok', 'unknown', 'skip', 'skip', 'ok']);
    expect(rows[1]).toMatchObject({ kind: 'roundStraight', values: { diameter: '150', length: '1000' }, quantity: '32', position: 'ПВ1-1' });
    expect(rows[2]).toMatchObject({ kind: 'roundElbow', values: { diameter: '150', angle: '90' } });
    expect(rows[6]).toMatchObject({ kind: 'roundReducer', values: { diameter: '150', smallDiameter: '100', length: '150' }, position: 'В1-25' });
    // a kind chosen by hand reads the sizes of the row again
    expect(withKind(rows[3], 'rectStraight')).toMatchObject({ status: 'ok', values: { width: '200', height: '400', length: '350' } });
    expect(withKind(rows[1], undefined).status).toBe('unknown');
  });
  it('counts the rows of a system when the file has no number column', () => {
    const t: Table = [['Система', 'Тип', 'Діаметр', 'Довжина, м'], ['В1', 'КВ', 125, 3], ['В1', 'КВ', 160, 3], ['В2', 'КВ', 200, 1]];
    expect(importRows(t, guessMapping(t)).map((r) => r.position)).toEqual(['В1-1', 'В1-2', 'В2-1']);
  });
});

describe('size columns', () => {
  it('resolve a family code to round or rect and read one-letter headers by case', () => {
    const t: Table = [['Тип', 'A', 'B', 'a', 'b', 'L'], ['СНВ', 400, 200, null, null, 1.25], ['Cap', 200, null, null, null, 0.05], ['ПП', 400, 300, 300, 200, 0.3]];
    const m = guessMapping(t);
    expect(m.columns).toMatchObject({ code: 0, A: 1, B: 2, a: 3, b: 4, L: 5 });
    const rows = importRows(t, m);
    expect(rows.map((r) => r.kind)).toEqual(['rectStraight', 'roundCap', 'rectReducer']);
    expect(rows[0].values).toEqual({ width: '400', height: '200', length: '1250' });
  });
});

describe('toFormRows', () => {
  it('builds form rows in file order with prefills and the elbow radius from the file', () => {
    const rows = toFormRows(importRows(template, guessMapping(template)), 100, defaultConfig);
    expect(rows.map((r) => [r.id, r.kind])).toEqual([[100, 'rectStraight'], [101, 'rectElbow'], [102, 'rectReducer'], [103, 'roundTap']]);
    expect(rows[1].values.innerRadius).toBe('125');
    expect(rows[1].manual).toContain('innerRadius');
    expect(rows[1].quantity).toBe('2');
  });
  it('suggests the elbow radius when the file has none', () => {
    const rows = toFormRows(importRows(freeText, guessMapping(freeText)), 1, defaultConfig);
    const elbow = rows.find((r) => r.kind === 'roundElbow')!;
    expect(elbow.values.centerRadius).toBe('150');
    expect(elbow.values.allowance).toBe('50');
  });
  it('gives a cap without a length the form default rim', () => {
    const t: Table = [['Назва', 'Кількість'], ['Заглушка Д160', 4]];
    expect(toFormRows(importRows(t, guessMapping(t)), 1, defaultConfig)[0].values).toMatchObject({ diameter: '160', length: '50' });
  });
});

describe('readCsv', () => {
  it('finds the separator past a title line', () => {
    expect(readCsv('Специфікація\nТип,Діаметр\nКВ,160\n')).toEqual([['Специфікація'], ['Тип', 'Діаметр'], ['КВ', '160']]);
  });
  it('reads ; separated text with quotes', () => {
    expect(readCsv('Тип;Назва\r\nКВ;"Д150; оц"\n\n')).toEqual([['Тип', 'Назва'], ['КВ', 'Д150; оц'], [null]].slice(0, 2));
  });
});

// a minimal xlsx (stored, not compressed): workbook, rels, shared strings and one sheet
function zip(files: Record<string, string>): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, body] of Object.entries(files)) {
    const n = enc.encode(name);
    const data = enc.encode(body);
    const local = new Uint8Array(30 + n.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, n.length, true);
    local.set(n, 30);
    const c = new Uint8Array(46 + n.length);
    const cv = new DataView(c.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, n.length, true);
    cv.setUint32(42, offset, true);
    c.set(n, 46);
    parts.push(local, data);
    central.push(c);
    offset += local.length + data.length;
  }
  const size = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, central.length, true);
  ev.setUint16(10, central.length, true);
  ev.setUint32(12, size, true);
  ev.setUint32(16, offset, true);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let p = 0;
  for (const a of all) { out.set(a, p); p += a.length; }
  return out;
}

describe('readXlsx', () => {
  it('reads shared, inline and formula strings and numbers of the first sheet', async () => {
    const bytes = zip({
      'xl/workbook.xml': '<workbook><sheets><sheet name="ВТС" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/sharedStrings.xml': '<sst><si><t>Тип</t></si><si><r><t>К</t></r><r><t>В</t></r></si></sst>',
      'xl/worksheets/sheet1.xml':
        '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>A &amp; B</t></is></c></row>' +
        '<row r="2" ht="20" customHeight="1"/><row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3"><f>1+1</f><v>2</v></c><c r="C3" t="str"><v>0,55</v></c></row></sheetData></worksheet>',
    });
    expect(await readXlsx(bytes)).toEqual([['Тип', null, 'A & B'], [], ['КВ', 2, '0,55']]);
  });
  it('rejects a file that is not a zip', async () => {
    await expect(readXlsx(new TextEncoder().encode('not a workbook'))).rejects.toMatchObject({ code: 'import.notXlsx' });
  });
});
