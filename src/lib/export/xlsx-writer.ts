/**
 * A minimal .xlsx writer (ADR 0102): sheets of text and number cells, a bold style, fixed number formats and column
 * widths. No dependency: the parts are plain XML packed into a ZIP with stored (uncompressed) entries.
 */

/** A cell: text, a number (shown with `digits` decimals) or empty. */
export type XCell = string | number | null | { value: string | number; bold?: boolean; digits?: number };
export interface XSheet {
  name: string;
  rows: XCell[][];
  widths?: number[]; // column widths in characters
}

// style ids in styles.xml: 0 plain, 1 bold, then numbers with 0..3 decimals (plain, bold)
const numStyle = (digits: number, bold: boolean) => 2 + Math.min(3, Math.max(0, digits)) * 2 + (bold ? 1 : 0);

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    // characters XML 1.0 does not allow
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

function colName(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function cellXml(c: XCell, ref: string): string {
  if (c === null || c === '') return '';
  const o = typeof c === 'object' ? c : { value: c };
  if (typeof o.value === 'number') {
    if (!Number.isFinite(o.value)) return '';
    return `<c r="${ref}" s="${numStyle(o.digits ?? 3, !!o.bold)}"><v>${o.value}</v></c>`;
  }
  const s = o.bold ? ' s="1"' : '';
  return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(o.value)}</t></is></c>`;
}

function sheetXml(sheet: XSheet): string {
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const rows = sheet.rows
    .map((r, i) => `<row r="${i + 1}">${r.map((c, j) => cellXml(c, `${colName(j)}${i + 1}`)).join('')}</row>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${rows}</sheetData></worksheet>`;
}

const formats = ['0', '0.0', '0.00', '0.000'];
const stylesXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  `<numFmts count="4">${formats.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${f}"/>`).join('')}</numFmts>` +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  `<cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>${formats
    .map((_, i) => [0, 1].map((b) => `<xf numFmtId="${164 + i}" fontId="${b}" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"${b ? ' applyFont="1"' : ''}/>`).join(''))
    .join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** Sheet names: at most 31 characters, none of []:*?/\ , unique. */
function sheetNames(sheets: XSheet[]): string[] {
  const used = new Set<string>();
  return sheets.map((s, i) => {
    let n = s.name.replace(/[[\]:*?/\\]/g, ' ').trim().slice(0, 31) || `Sheet${i + 1}`;
    while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${i + 1}`;
    used.add(n.toLowerCase());
    return n;
  });
}

/** The workbook parts by path. */
export function workbookParts(sheets: XSheet[]): Record<string, string> {
  const names = sheetNames(sheets);
  const parts: Record<string, string> = {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
      '</Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
      '</sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': stylesXml,
  };
  sheets.forEach((s, i) => (parts[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(s)));
  return parts;
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of data) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A ZIP archive with stored entries (method 0), UTF-8 names. */
export function zipStore(files: Record<string, Uint8Array>): Uint8Array {
  const enc = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const entries = Object.entries(files);
  for (const [name, data] of entries) {
    const n = enc.encode(name);
    const crc = crc32(data);
    const head = new Uint8Array(30 + n.length);
    const h = new DataView(head.buffer);
    h.setUint32(0, 0x04034b50, true);
    h.setUint16(4, 20, true);
    h.setUint16(6, 0x0800, true); // UTF-8 names
    h.setUint16(8, 0, true);
    h.setUint32(14, crc, true);
    h.setUint32(18, data.length, true);
    h.setUint32(22, data.length, true);
    h.setUint16(26, n.length, true);
    head.set(n, 30);
    const dir = new Uint8Array(46 + n.length);
    const d = new DataView(dir.buffer);
    d.setUint32(0, 0x02014b50, true);
    d.setUint16(4, 20, true);
    d.setUint16(6, 20, true);
    d.setUint16(8, 0x0800, true);
    d.setUint32(16, crc, true);
    d.setUint32(20, data.length, true);
    d.setUint32(24, data.length, true);
    d.setUint16(28, n.length, true);
    d.setUint32(42, offset, true);
    dir.set(n, 46);
    local.push(head, data);
    central.push(dir);
    offset += head.length + data.length;
  }
  const dirSize = central.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, entries.length, true);
  e.setUint16(10, entries.length, true);
  e.setUint32(12, dirSize, true);
  e.setUint32(16, offset, true);
  const out = new Uint8Array(offset + dirSize + 22);
  let p = 0;
  for (const part of [...local, ...central, end]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/** The .xlsx file bytes. */
export function writeXlsx(sheets: XSheet[]): Uint8Array {
  const enc = new TextEncoder();
  return zipStore(Object.fromEntries(Object.entries(workbookParts(sheets)).map(([k, v]) => [k, enc.encode(v)])));
}
