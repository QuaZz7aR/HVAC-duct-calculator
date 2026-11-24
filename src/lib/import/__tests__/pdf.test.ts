import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { glyphName, layoutTable, parseCMap, readPdf, type Piece } from '../pdf';
import { guessMapping, importRows } from '../mapping';

/** A minimal PDF: objects in order, a correct-enough xref is not needed (the reader scans for `n 0 obj`). */
function pdf(objects: (string | Uint8Array)[]): Uint8Array {
  const parts: Uint8Array[] = [Buffer.from('%PDF-1.7\n')];
  objects.forEach((o, i) => {
    parts.push(Buffer.from(`${i + 1} 0 obj\n`));
    parts.push(typeof o === 'string' ? Buffer.from(o, 'latin1') : o);
    parts.push(Buffer.from('\nendobj\n'));
  });
  parts.push(Buffer.from('trailer\n<< /Root 1 0 R >>\n%%EOF\n'));
  return new Uint8Array(Buffer.concat(parts));
}
const stream = (dict: string, data: Buffer) => Buffer.concat([Buffer.from(`<< ${dict} /Length ${data.length} >>\nstream\n`), data, Buffer.from('\nendstream')]);

/** Cyrillic through a two-byte font with a ToUnicode map: code = Unicode code point, as many generators do. */
const hex = (s: string) => '<' + [...s].map((c) => c.charCodeAt(0).toString(16).padStart(4, '0')).join('') + '>';
const cmap = (chars: string) =>
  `/CIDInit /ProcSet findresource begin 12 dict begin begincmap 1 begincodespacerange <0000> <FFFF> endcodespacerange\n${[...new Set(chars)].length} beginbfchar\n` +
  [...new Set(chars)].map((c) => `${hex(c)} ${hex(c)}`).join('\n') + '\nendbfchar endcmap end end';

function specPdf(compress: boolean) {
  const rows = [
    ['Система', '№', 'Найменування', 'Довжина, мм', 'Кількість, шт'],
    ['ПВ1', '1', 'КВ Д250', '1000', '4'],
    ['ПВ1', '2', 'ПВ 400х200', '1250', '3'],
    ['ПВ1', '3', 'КО 90 Д250', '', '2'],
  ];
  const xs = [40, 110, 150, 330, 420];
  let content = 'BT /F1 10 Tf\n';
  rows.forEach((r, i) => r.forEach((c, j) => { if (c) content += `1 0 0 1 ${xs[j]} ${700 - i * 16} Tm ${hex(c)} Tj\n`; }));
  content += 'ET\n';
  // borders: vertical lines between the columns
  for (const x of [35, 105, 145, 325, 415, 500]) content += `${x} 640 m ${x} 715 l S\n`;
  const all = rows.flat().join('');
  const body = Buffer.from(content, 'latin1');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    compress ? stream('/Filter /FlateDecode', deflateSync(body)) : stream('', body),
    '<< /Type /Font /Subtype /Type0 /BaseFont /Arial /Encoding /Identity-H /DescendantFonts [7 0 R] /ToUnicode 6 0 R >>',
    stream('', Buffer.from(cmap(all), 'latin1')),
    '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Arial /DW 556 >>',
  ]);
}

describe('readPdf', () => {
  for (const compress of [false, true]) {
    it(`reads a bordered table with Cyrillic text (${compress ? 'FlateDecode' : 'plain'} content)`, async () => {
      const t = await readPdf(specPdf(compress));
      expect(t[0]).toEqual(['Система', '№', 'Найменування', 'Довжина, мм', 'Кількість, шт']);
      expect(t[1]).toEqual(['ПВ1', '1', 'КВ Д250', '1000', '4']);
      expect(t[3]).toEqual(['ПВ1', '3', 'КО 90 Д250', null, '2']);
      const rows = importRows(t, guessMapping(t)).filter((r) => r.status === 'ok');
      expect(rows.map((r) => [r.position, r.kind, r.quantity])).toEqual([
        ['ПВ1-1', 'roundStraight', '4'],
        ['ПВ1-2', 'rectStraight', '3'],
        ['ПВ1-3', 'roundElbow', '2'],
      ]);
    });
  }

  it('rejects a file that is not a PDF and a PDF with no text', async () => {
    await expect(readPdf(new Uint8Array(Buffer.from('PK\x03\x04 not a pdf')))).rejects.toMatchObject({ code: 'import.notPdf' });
    const empty = pdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>', stream('', Buffer.from('0 0 m 100 100 l S'))]);
    await expect(readPdf(empty)).rejects.toMatchObject({ code: 'import.pdfNoText' });
  });

  it('reads a simple font with WinAnsi codes, TJ kerning and escaped strings', async () => {
    const body = Buffer.from('BT /F1 12 Tf 50 700 Td (Size \\(mm\\)) Tj 0 -20 Td [(40) -50 (0)] TJ ET', 'latin1');
    const t = await readPdf(pdf([
      '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', stream('', body),
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ]));
    expect(t).toEqual([['Size (mm)'], ['400']]);
  });
});

/**
 * An Excel sheet saved as a PDF by a generator like the acquaintances' (Чугуїв): Cyrillic in a Type0 font with the
 * predefined UniGB-UTF16-H CMap and no ToUnicode, each cell clipped to its box and wrapped over several lines (a header
 * broken inside words, «ПВ1» / «П», «#VALU» / «E!»), cells of one row drawn at different heights, borders as lines.
 */
function clippedPdf() {
  const xs = [50, 80, 130, 160, 210, 250, 290, 330];
  const cells: [number, number, string[]][] = [];
  // header: one box 60 pt high; body rows: 30 pt
  const header = [['№', 'сист'], ['Найм', 'енув', 'ання'], ['Код'], ['Шири', 'на, А,', 'мм'], ['Вис', 'ота,', 'B, мм'], ['Довж', 'ина, м'], ['Кіль', 'кість']];
  header.forEach((lines, i) => cells.push([i, 0, lines]));
  const body = [
    [['ПВ1', 'П'], ['550х350'], ['ПВ'], ['550'], ['300'], ['1'], ['1']],
    [['ПВ1', 'П'], ['Відвід'], ['ПО'], ['300'], ['500'], ['#VALU', 'E!'], ['2']],
  ];
  body.forEach((r, j) => r.forEach((lines, i) => cells.push([i, j + 1, lines])));
  let content = '';
  for (const [i, j, lines] of cells) {
    const top = j === 0 ? 760 : 700 - (j - 1) * 30;
    const h = j === 0 ? 60 : 30;
    const x = xs[i], w = xs[i + 1] - xs[i];
    content += `q ${x} ${top - h} ${w} ${h} re W n\n`;
    // the lines centred in the box, 11 pt apart
    lines.forEach((t, k) => {
      const y = top - h / 2 + ((lines.length - 1) / 2 - k) * 11 - 3;
      content += `BT 1 0 0 1 ${x + 2} ${y} Tm /F1 9 Tf ${hex(t)} Tj ET\n`;
    });
    content += 'Q\n';
    for (const bx of [x, x + w]) content += `${bx} ${top} m ${bx} ${top - h} l S\n`;
  }
  const data = Buffer.from(content, 'latin1');
  return pdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    stream('', data),
    '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UTF16-H /DescendantFonts [6 0 R] >>',
    '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 4 >> /DW 1000 >>',
  ]);
}

describe('readPdf: an Excel sheet printed with clipped, wrapped cells', () => {
  it('decodes a UTF-16 CMap font without ToUnicode and keeps each clipped cell whole', async () => {
    const t = await readPdf(clippedPdf());
    expect(t[1]).toEqual(['ПВ1П', '550х350', 'ПВ', '550', '300', '1', '1']);
    expect(t[2]).toEqual(['ПВ1П', 'Відвід', 'ПО', '300', '500', '#VALU E!', '2']);
    const m = guessMapping(t);
    expect(m.columns).toMatchObject({ A: 3, B: 4, L: 5, quantity: 6, code: 2 });
    expect(m.lengthUnit).toBe('m');
    const rows = importRows(t, m).filter((r) => r.status === 'ok');
    expect(rows.map((r) => [r.kind, r.values.width, r.values.height, r.quantity])).toEqual([
      ['rectStraight', '550', '300', '1'],
      ['rectElbow', '300', '500', '2'],
    ]);
  });
});

describe('PDF helpers', () => {
  it('parses ToUnicode bfchar and both bfrange forms', () => {
    const { map, bytes } = parseCMap('1 begincodespacerange <00> <FF> endcodespacerange 1 beginbfchar <01> <0414> endbfchar 2 beginbfrange <10> <12> <0430> <20> <21> [<0031> <0032>] endbfrange');
    expect(bytes).toBe(1);
    expect([map.get(1), map.get(0x10), map.get(0x12), map.get(0x20), map.get(0x21)]).toEqual(['Д', 'а', 'в', '1', '2']);
  });
  it('maps glyph names of Differences arrays', () => {
    expect([glyphName('uni0414'), glyphName('afii10017'), glyphName('afii10097'), glyphName('afii10103'), glyphName('zero'), glyphName('x')]).toEqual(['Д', 'А', 'я', 'і', '0', 'x']);
    expect(glyphName('afii99999')).toBeUndefined();
  });
  it('lays out pieces into lines and text-range columns when no borders are drawn, joining a wrapped header', () => {
    const p = (x: number, y: number, text: string): Piece => ({ page: 0, x, y, end: x + text.length * 5, size: 10, text });
    const t = layoutTable([
      p(10, 720, 'Довжина,'), p(200, 720, 'Кіль-'),
      p(10, 708, 'мм'), p(100, 708, 'Назва'), p(200, 708, 'кість'),
      p(10, 690, '1000'), p(100, 690, 'КВ'), p(103, 690.5, ' Д250'), p(200, 690, '4'),
      p(10, 674, '500'), p(100, 674, 'ПВ 400х200'), p(200, 674, '2'),
    ]);
    expect(t.filter((r) => r.length)).toEqual([
      ['Довжина, мм', 'Назва', 'Кіль-кість'],
      ['1000', 'КВ Д250', '4'],
      ['500', 'ПВ 400х200', '2'],
    ]);
  });
});
