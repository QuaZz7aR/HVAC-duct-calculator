/**
 * A small reader for the first sheet of an .xlsx file, in the browser only (ADR 0061): the file never leaves the device.
 * No dependency: the ZIP container is read by hand and inflated with the platform's DecompressionStream ('deflate-raw'),
 * the sheet XML is plain enough (cells, shared strings) to read with regular expressions, so the same code runs in Node tests.
 * Formula cells give their cached value, as Excel saved it.
 */

export type Cell = string | number | null;
export type Table = Cell[][];

/** Rows a PDF reader joined from several text lines (a wrapped cell, ADR 0100): row -> the number of lines. */
export const rowLines = new WeakMap<Cell[], number>();

export type ImportErrorCode = 'import.notXlsx' | 'import.noSheet' | 'import.empty' | 'import.unknownType' | 'import.notPdf' | 'import.pdfNoText';

/** Thrown with a stable code; the UI turns it into text. */
export class ImportError extends Error {
  readonly code: ImportErrorCode;
  constructor(code: ImportErrorCode) {
    super(code);
    this.code = code;
  }
}

interface ZipEntry { method: number; compressedSize: number; offset: number }

function zipDirectory(bytes: Uint8Array): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // end of central directory: signature 0x06054b50 within the last 64 KiB + 22 bytes
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ImportError('import.notXlsx');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const entries = new Map<string, ZipEntry>();
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (p + 46 > bytes.length || view.getUint32(p, true) !== 0x02014b50) throw new ImportError('import.notXlsx');
    const method = view.getUint16(p + 10, true);
    const compressedSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    // data starts after the local header, whose name and extra lengths may differ from the central ones
    const offset = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    entries.set(name, { method, compressedSize, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readEntry(bytes: Uint8Array, dir: Map<string, ZipEntry>, name: string): Promise<string | undefined> {
  const e = dir.get(name);
  if (!e) return undefined;
  const raw = bytes.subarray(e.offset, e.offset + e.compressedSize);
  const data = e.method === 0 ? raw : e.method === 8 ? await inflate(raw) : undefined;
  if (!data) throw new ImportError('import.notXlsx');
  return new TextDecoder().decode(data);
}

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function unescapeXml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : entities[e] ?? m);
}

/** The text of all <t> runs inside a fragment (shared string or inline string, rich text included). */
function textOf(fragment: string): string {
  let out = '';
  for (const m of fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) out += m[1];
  return unescapeXml(out);
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

/** "AB12" -> column index 27 (0-based). */
function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref) {
    const c = ch.charCodeAt(0);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/** The path of the first sheet, from the workbook and its relationships. */
async function firstSheetPath(bytes: Uint8Array, dir: Map<string, ZipEntry>): Promise<string> {
  const wb = await readEntry(bytes, dir, 'xl/workbook.xml');
  const rels = await readEntry(bytes, dir, 'xl/_rels/workbook.xml.rels');
  const sheetTag = wb && /<sheet\s[^>]*>/.exec(wb)?.[0];
  const rid = sheetTag && (attr(sheetTag, 'r:id') ?? /\sr:id="([^"]*)"|\s\w+:id="([^"]*)"/.exec(sheetTag)?.slice(1).find(Boolean));
  if (rid && rels) {
    for (const m of rels.matchAll(/<Relationship\s[^>]*>/g)) {
      if (attr(m[0], 'Id') !== rid) continue;
      const target = attr(m[0], 'Target') ?? '';
      return target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
    }
  }
  const fallback = [...dir.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!fallback) throw new ImportError('import.noSheet');
  return fallback;
}

/** The first sheet as rows of cells; empty cells are null, trailing empty rows are dropped. */
export async function readXlsx(bytes: Uint8Array): Promise<Table> {
  const dir = zipDirectory(bytes);
  const path = await firstSheetPath(bytes, dir);
  const sheet = await readEntry(bytes, dir, path);
  if (!sheet) throw new ImportError('import.noSheet');
  const sharedXml = await readEntry(bytes, dir, 'xl/sharedStrings.xml');
  const shared = sharedXml ? [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : [];

  const table: Table = [];
  // a row may be self-closing (an empty row with a custom height)
  for (const row of sheet.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const r = Number(attr(row[1], 'r') ?? table.length + 1) - 1;
    const cells: Cell[] = [];
    let next = 0;
    for (const c of (row[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(c[1], 'r');
      const col = ref ? columnIndex(ref) : next;
      next = col + 1;
      const body = c[2] ?? '';
      const type = attr(c[1], 't');
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value: Cell = null;
      if (type === 's') value = v !== undefined ? shared[Number(v)] ?? null : null;
      else if (type === 'inlineStr') value = textOf(body);
      else if (type === 'str' || type === 'e') value = v !== undefined ? unescapeXml(v) : null;
      else if (type === 'b') value = v === '1' ? 1 : 0;
      else if (v !== undefined) value = Number(v);
      if (typeof value === 'string' && value.trim() === '') value = null;
      cells[col] = value;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = null;
    table[r] = cells;
  }
  for (let i = 0; i < table.length; i++) if (!table[i]) table[i] = [];
  while (table.length && table[table.length - 1].every((c) => c === null)) table.pop();
  if (!table.length) throw new ImportError('import.empty');
  return table;
}

/** A CSV or TSV text as rows; the separator (; , or tab) is the most common one in the first line; numbers stay text. */
export function readCsv(text: string): Table {
  const src = text.replace(/^﻿/, '');
  // the separator splits the first lines most often (a title line may have none)
  const lines = src.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20);
  const count = (s: string) => lines.reduce((n, l) => n + l.split(s).length - 1, 0);
  const sep = [';', '\t', ','].map((s) => [s, count(s)] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: Table = [];
  let row: Cell[] = [];
  let cell = '';
  let quoted = false;
  const push = () => { row.push(cell.trim() === '' ? null : cell.trim()); cell = ''; };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') { quoted = true; cell = ''; }
    else if (ch === sep) push();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      push(); rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { push(); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every((c) => c === null)) rows.pop();
  if (!rows.length) throw new ImportError('import.empty');
  return rows;
}
