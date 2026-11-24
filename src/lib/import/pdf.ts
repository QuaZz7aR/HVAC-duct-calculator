/**
 * A small reader for spec tables in a PDF, in the browser only (ADR 0096): the file never leaves the device, no dependency.
 * It reads text PDFs (exported from Excel, LibreOffice, AutoCAD, a browser's «print to PDF»), not scans: a scan has no text.
 * Steps: the objects (also inside object streams), FlateDecode streams through the platform's DecompressionStream, the page
 * tree in order, each page's content stream run as text operators with the fonts' ToUnicode maps and widths, then the text
 * pieces are laid out into lines (by y) and columns (x ranges shared by the table lines), which gives the same `Table` as
 * the .xlsx reader, so the column mapping and the preview are the same.
 */
import { ImportError, rowLines, type Cell, type Table } from './xlsx';

// ---------- objects ----------

type Ref = { ref: [number, number] };
type Name = { name: string };
type PdfStream = { dict: Dict; data: Uint8Array };
type Value = number | boolean | null | string | Name | Ref | Value[] | Dict | PdfStream;
interface Dict { [key: string]: Value }

const isName = (v: Value | undefined): v is Name => typeof v === 'object' && v !== null && 'name' in v;
const isRef = (v: Value | undefined): v is Ref => typeof v === 'object' && v !== null && 'ref' in v;
const isStream = (v: Value | undefined): v is PdfStream => typeof v === 'object' && v !== null && 'data' in v && 'dict' in v;
const isDict = (v: Value | undefined): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v) && !isName(v) && !isRef(v) && !isStream(v);

const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);

/** Bytes as a string of char codes 0-255 (strings in a PDF are bytes, decoded later by the font). */
function binary(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return s;
}

/** A tokenizer and value parser over a byte string; also used for content streams, where operators are bare words. */
class Lexer {
  pos = 0;
  constructor(readonly s: string) {}

  skip() {
    for (;;) {
      const c = this.s.charCodeAt(this.pos);
      if (WS.has(c)) this.pos++;
      else if (c === 37) { while (this.pos < this.s.length && !/[\r\n]/.test(this.s[this.pos])) this.pos++; }
      else return;
    }
  }

  /** One value, or an operator word as `{ op }` (content streams), or undefined at the end. */
  next(): Value | { op: string } | undefined {
    this.skip();
    const s = this.s;
    if (this.pos >= s.length) return undefined;
    const c = s[this.pos];
    if (c === '/') {
      let e = this.pos + 1;
      while (e < s.length && !WS.has(s.charCodeAt(e)) && !DELIM.has(s.charCodeAt(e))) e++;
      const raw = s.slice(this.pos + 1, e);
      this.pos = e;
      return { name: raw.replace(/#([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16))) };
    }
    if (c === '(') return this.literal();
    if (c === '<' && s[this.pos + 1] === '<') {
      this.pos += 2;
      const d: Dict = {};
      for (;;) {
        this.skip();
        if (s.startsWith('>>', this.pos)) { this.pos += 2; break; }
        if (this.pos >= s.length) break;
        const k = this.next();
        if (!isName(k as Value)) { this.pos++; continue; }
        const v = this.value();
        d[(k as Name).name] = v ?? null;
      }
      return d;
    }
    if (c === '<') {
      const e = s.indexOf('>', this.pos);
      const hex = s.slice(this.pos + 1, e < 0 ? s.length : e).replace(/[^0-9a-fA-F]/g, '');
      this.pos = e < 0 ? s.length : e + 1;
      let out = '';
      for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2).padEnd(2, '0'), 16));
      return out;
    }
    if (c === '[') {
      this.pos++;
      const a: Value[] = [];
      for (;;) {
        this.skip();
        if (s[this.pos] === ']') { this.pos++; break; }
        if (this.pos >= s.length) break;
        const v = this.value();
        if (v !== undefined) a.push(v);
      }
      return a;
    }
    if (c === ']' || c === '>' || c === ')' || c === '{' || c === '}') { this.pos++; return this.next(); }
    let e = this.pos;
    while (e < s.length && !WS.has(s.charCodeAt(e)) && !DELIM.has(s.charCodeAt(e))) e++;
    if (e === this.pos) e++;
    const word = s.slice(this.pos, e);
    this.pos = e;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(word)) return Number(word);
    if (word === 'true') return true;
    if (word === 'false') return false;
    if (word === 'null') return null;
    return { op: word };
  }

  /** A value; `n g R` becomes a reference. */
  value(): Value | undefined {
    const v = this.next();
    if (v !== undefined && typeof v === 'object' && v !== null && 'op' in v) return undefined;
    if (typeof v === 'number' && Number.isInteger(v)) {
      const save = this.pos;
      const g = this.next();
      if (typeof g === 'number' && Number.isInteger(g)) {
        const r = this.next();
        if (r && typeof r === 'object' && 'op' in r && r.op === 'R') return { ref: [v, g] };
      }
      this.pos = save;
    }
    return v as Value | undefined;
  }

  private literal(): string {
    const s = this.s;
    let depth = 0;
    let out = '';
    let i = this.pos;
    for (; i < s.length; i++) {
      const ch = s[i];
      if (ch === '\\') {
        const n = s[++i];
        const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' };
        if (n in map) out += map[n];
        else if (/[0-7]/.test(n)) {
          let oct = n;
          while (oct.length < 3 && /[0-7]/.test(s[i + 1])) oct += s[++i];
          out += String.fromCharCode(parseInt(oct, 8) & 255);
        } else if (n === '\r') { if (s[i + 1] === '\n') i++; }
        else if (n !== '\n') out += n;
      } else if (ch === '(') { if (depth++ > 0) out += ch; }
      else if (ch === ')') { if (--depth === 0) { i++; break; } out += ch; }
      else out += ch;
    }
    this.pos = i;
    return out;
  }
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  // a damaged or truncated stream still gives the part that inflated
  const chunks: Uint8Array[] = [];
  try {
    const reader = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } catch { /* keep what was read */ }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}

class Doc {
  readonly objects = new Map<number, Value>();
  constructor(readonly src: string, readonly bytes: Uint8Array) {}

  get(v: Value | undefined): Value | undefined {
    for (let n = 0; isRef(v) && n < 32; n++) v = this.objects.get(v.ref[0]);
    return v;
  }
  dict(v: Value | undefined): Dict | undefined {
    const d = this.get(v);
    return isStream(d) ? d.dict : isDict(d) ? d : undefined;
  }

  /** The decoded bytes of a stream: FlateDecode only (other filters are images, which a spec table does not need). */
  async data(v: Value | undefined): Promise<Uint8Array | undefined> {
    const st = this.get(v);
    if (!isStream(st)) return undefined;
    const f = this.get(st.dict.Filter);
    const filters = (Array.isArray(f) ? f : f ? [f] : []).map((x) => (isName(this.get(x)) ? (this.get(x) as Name).name : ''));
    let data = st.data;
    for (const name of filters) {
      if (name === 'FlateDecode' || name === 'Fl') data = await inflate(data);
      else return undefined;
    }
    return data;
  }
}

/** Every `n g obj ... endobj` in the file, then the objects packed in object streams; the last definition wins. */
async function parseObjects(bytes: Uint8Array): Promise<Doc> {
  const src = binary(bytes);
  const doc = new Doc(src, bytes);
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  for (let m; (m = re.exec(src)); ) {
    const num = Number(m[1]);
    const lx = new Lexer(src);
    lx.pos = re.lastIndex;
    const v = lx.value();
    lx.skip();
    let value: Value = v ?? null;
    if (isDict(value) && src.startsWith('stream', lx.pos)) {
      let start = lx.pos + 6;
      if (src[start] === '\r') start++;
      if (src[start] === '\n') start++;
      const dict = value as Dict;
      const len = dict.Length;
      let end = typeof len === 'number' && src.startsWith('endstream', skipWs(src, start + len)) ? start + len : src.indexOf('endstream', start);
      if (end < 0) end = src.length;
      value = { dict, data: bytes.subarray(start, end) };
      re.lastIndex = end;
    }
    doc.objects.set(num, value);
  }
  // a /Length given as a reference: cut again now that the reference resolves
  for (const [num, v] of doc.objects) {
    if (!isStream(v) || !isRef(v.dict.Length)) continue;
    const len = doc.get(v.dict.Length);
    if (typeof len === 'number' && len <= v.data.length) doc.objects.set(num, { dict: v.dict, data: v.data.subarray(0, len) });
  }
  for (const v of [...doc.objects.values()]) {
    if (!isStream(v) || !isName(v.dict.Type) || v.dict.Type.name !== 'ObjStm') continue;
    const data = await doc.data(v);
    if (!data) continue;
    const s = binary(data);
    const n = Number(doc.get(v.dict.N));
    const first = Number(doc.get(v.dict.First));
    const head = new Lexer(s.slice(0, first));
    const pairs: [number, number][] = [];
    for (let i = 0; i < n; i++) pairs.push([Number(head.next()), Number(head.next())]);
    for (const [num, off] of pairs) {
      if (doc.objects.has(num) && !isStream(v)) continue;
      const lx = new Lexer(s);
      lx.pos = first + off;
      const val = lx.value();
      if (!doc.objects.has(num)) doc.objects.set(num, val ?? null);
    }
  }
  return doc;
}

function skipWs(s: string, i: number) {
  while (i < s.length && WS.has(s.charCodeAt(i))) i++;
  return i;
}

// ---------- fonts ----------

interface Font {
  /** bytes per character code (2 for Identity-H CID fonts) */
  bytes: number;
  toUnicode: Map<number, string>;
  /** glyph width in 1/1000 of the font size */
  width: (code: number) => number;
  /** codes without a ToUnicode entry: WinAnsi / Differences for simple fonts */
  fallback: (code: number) => string;
}

const winAnsi: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

/** A glyph name of a Differences array: uniXXXX, uXXXX, afii Cyrillic, a few common names; else undefined. */
export function glyphName(name: string): string | undefined {
  const uni = /^uni([0-9A-Fa-f]{4})$/.exec(name) ?? /^u([0-9A-Fa-f]{4,6})$/.exec(name);
  if (uni) return String.fromCodePoint(parseInt(uni[1], 16));
  const afii = /^afii(\d+)$/.exec(name);
  if (afii) {
    const n = Number(afii[1]);
    // Adobe Glyph List: afii10017-10049 = А-Я with Ё, 10065-10097 = а-я with ё, plus Є/є, І/і, Ї/ї, Ґ/ґ
    const extra: Record<number, number> = { 10023: 0x401, 10071: 0x451, 10053: 0x404, 10101: 0x454, 10055: 0x406, 10103: 0x456, 10056: 0x407, 10104: 0x457, 10050: 0x490, 10098: 0x491 };
    if (extra[n]) return String.fromCharCode(extra[n]);
    // Ё (10023) and ё (10071) sit inside the runs, so the letters after them are one code further
    if (n >= 10017 && n <= 10049) return String.fromCharCode(0x410 + n - 10017 - (n > 10023 ? 1 : 0));
    if (n >= 10065 && n <= 10097) return String.fromCharCode(0x430 + n - 10065 - (n > 10071 ? 1 : 0));
    return undefined;
  }
  const common: Record<string, string> = { space: ' ', period: '.', comma: ',', hyphen: '-', minus: '−', multiply: '×', slash: '/', degree: '°', numbersign: '#', numero: '№', afii61352: '№' };
  if (common[name]) return common[name];
  if (/^[A-Za-z]$/.test(name)) return name;
  const digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'].indexOf(name);
  return digits >= 0 ? String(digits) : undefined;
}

/** A ToUnicode CMap: bfchar and bfrange (both forms); also its code length from the codespace range. */
export function parseCMap(text: string): { map: Map<number, string>; bytes: number } {
  const map = new Map<number, string>();
  const hex = (h: string) => parseInt(h, 16);
  const utf16 = (h: string) => {
    let s = '';
    for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(hex(h.slice(i, i + 4)));
    if (h.length % 4 === 2) s += String.fromCharCode(hex(h.slice(-2)));
    return s;
  };
  let bytes = 1;
  const space = /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(text);
  if (space) bytes = Math.max(1, space[1].length / 2);
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
    for (const m of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) map.set(hex(m[1]), utf16(m[2]));
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(?:<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)) {
      const lo = hex(m[1]);
      const hi = Math.min(hex(m[2]), lo + 65535);
      if (m[3] !== undefined) {
        const base = m[3];
        const last = hex(base.slice(-4));
        for (let c = lo; c <= hi; c++) map.set(c, utf16(base.slice(0, -4) + (last + c - lo).toString(16).padStart(4, '0')));
      } else {
        const items = [...m[4].matchAll(/<([0-9a-fA-F]*)>/g)].map((x) => x[1]);
        items.forEach((h, i) => map.set(lo + i, utf16(h)));
      }
    }
  }
  return { map, bytes };
}

async function loadFont(doc: Doc, ref: Value | undefined): Promise<Font> {
  const f = doc.dict(ref) ?? {};
  const subtype = isName(f.Subtype) ? f.Subtype.name : '';
  const type0 = subtype === 'Type0';
  let toUnicode = new Map<number, string>();
  let bytes = type0 ? 2 : 1;
  const tu = await doc.data(f.ToUnicode);
  if (tu) {
    const cm = parseCMap(binary(tu));
    toUnicode = cm.map;
    if (type0) bytes = cm.bytes;
  }
  let width: (code: number) => number = () => 500;
  if (type0) {
    const desc = doc.dict((doc.get(f.DescendantFonts) as Value[] | undefined)?.[0]) ?? {};
    const dw = Number(doc.get(desc.DW) ?? 1000);
    const widths = new Map<number, number>();
    const w = doc.get(desc.W);
    if (Array.isArray(w)) {
      for (let i = 0; i < w.length; ) {
        const first = Number(doc.get(w[i]));
        const next = doc.get(w[i + 1]);
        if (Array.isArray(next)) { next.forEach((x, j) => widths.set(first + j, Number(doc.get(x)))); i += 2; }
        else { const last = Number(next); const v = Number(doc.get(w[i + 2])); for (let c = first; c <= last && c - first < 65536; c++) widths.set(c, v); i += 3; }
      }
    }
    width = (c) => widths.get(c) ?? dw;
  } else {
    const first = Number(doc.get(f.FirstChar) ?? 0);
    const ws = doc.get(f.Widths);
    if (Array.isArray(ws)) width = (c) => Number(doc.get(ws[c - first]) ?? 500) || 500;
  }
  const diffs = new Map<number, string>();
  const enc = doc.dict(f.Encoding);
  const d = enc && doc.get(enc.Differences);
  if (Array.isArray(d)) {
    let code = 0;
    for (const x of d) {
      const v = doc.get(x);
      if (typeof v === 'number') code = v;
      else if (isName(v)) { const ch = glyphName(v.name); if (ch !== undefined) diffs.set(code, ch); code++; }
    }
  }
  // a predefined Unicode CMap (UniGB-UTF16-H, UniJIS-UCS2-H, ...): the 2-byte codes are UTF-16 themselves, no ToUnicode needed
  const unicodeCMap = type0 && isName(f.Encoding) && /^Uni\w+-(UTF16|UCS2)-[HV]$/.test(f.Encoding.name);
  const fallback = (c: number) =>
    diffs.get(c) ?? (unicodeCMap ? String.fromCharCode(c) : type0 ? '' : winAnsi[c] ?? (c >= 32 ? String.fromCharCode(c) : ''));
  return { bytes, toUnicode, width, fallback };
}

// ---------- content streams ----------

/** A run of text on a page, in page space: start x, baseline y, end x, font size. */
export interface Piece {
  page: number; x: number; y: number; end: number; size: number; text: string;
  /** false for rotated text (a vertical header) */
  upright?: boolean;
  /** the clipping rectangle the text was drawn in, [x0, y0, x1, y1]: a cell box when a generator clips each cell */
  clip?: [number, number, number, number];
}

/** A vertical line of a table border on a page, in page space. */
export interface Rule { page: number; x: number; y0: number; y1: number }

/** A horizontal line of a table border on a page, in page space: the row borders (ADR 0100). */
export interface HRule { page: number; y: number; x0: number; x1: number }

interface Out { pieces: Piece[]; rules: Rule[]; hrules: HRule[] }

type Matrix = [number, number, number, number, number, number];
const mul = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3],
  a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3],
  a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5],
];

async function runContent(doc: Doc, content: string, resources: Dict, page: number, ctm0: Matrix, out: Out, depth = 0): Promise<void> {
  const fontDict = doc.dict(resources.Font) ?? {};
  const xobjects = doc.dict(resources.XObject) ?? {};
  const fonts = new Map<string, Font>();
  const lx = new Lexer(content);
  const stack: Value[] = [];
  let ctm = ctm0;
  const saved: Matrix[] = [];
  let tm: Matrix = [1, 0, 0, 1, 0, 0];
  let tlm: Matrix = [1, 0, 0, 1, 0, 0];
  let font: Font | undefined;
  // clipping: the last rectangle of the path, a pending W, the current clip box (saved and restored with q / Q)
  let rect: [number, number, number, number] | undefined;
  let pendingClip = false;
  let clip: [number, number, number, number] | undefined;
  const savedClip: (typeof clip)[] = [];
  let size = 1, leading = 0, charSpace = 0, wordSpace = 0, scale = 1, rise = 0;
  const nums = (n: number) => stack.slice(-n).map(Number);
  // path construction: vertical segments and the sides of rectangles are the table's column borders
  let cur: [number, number] = [0, 0];
  const pt = (x: number, y: number): [number, number] => [x * ctm[0] + y * ctm[2] + ctm[4], x * ctm[1] + y * ctm[3] + ctm[5]];
  const vertical = (a: [number, number], b: [number, number]) => {
    if (Math.abs(a[0] - b[0]) < 0.8 && Math.abs(a[1] - b[1]) > 4) out.rules.push({ page, x: (a[0] + b[0]) / 2, y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) });
  };
  const horizontal = (a: [number, number], b: [number, number]) => {
    if (Math.abs(a[1] - b[1]) < 0.8 && Math.abs(a[0] - b[0]) > 4) out.hrules.push({ page, y: (a[1] + b[1]) / 2, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]) });
  };

  const show = (str: string) => {
    if (!font) return;
    const trm = mul([size * scale, 0, 0, size, 0, rise], mul(tm, ctm));
    let text = '';
    let advance = 0;
    for (let i = 0; i + font.bytes <= str.length; i += font.bytes) {
      let code = 0;
      for (let b = 0; b < font.bytes; b++) code = code * 256 + str.charCodeAt(i + b);
      const ch = font.toUnicode.get(code) ?? font.fallback(code);
      text += ch;
      advance += (font.width(code) / 1000) * size + charSpace + (font.bytes === 1 && code === 32 ? wordSpace : 0);
    }
    advance *= scale;
    const x = trm[4];
    const y = trm[5];
    const end = mul([1, 0, 0, 1, advance, 0], mul(tm, ctm))[4];
    const fs = Math.hypot(trm[2], trm[3]) || size;
    const upright = trm[0] > 0 && Math.abs(trm[1]) < 1e-6 * Math.abs(trm[0]) + 1e-9;
    if (text.length) out.pieces.push({ page, x, y, end: Math.max(end, x), size: fs, text, upright, ...(clip ? { clip } : {}) });
    tm = mul([1, 0, 0, 1, advance, 0], tm);
  };

  for (;;) {
    const tok = lx.next();
    if (tok === undefined) break;
    if (!(typeof tok === 'object' && tok !== null && 'op' in tok)) {
      // inline image data is skipped whole
      stack.push(tok as Value);
      continue;
    }
    const op = tok.op;
    switch (op) {
      case 'm': { const [x, y] = nums(2); cur = pt(x, y); break; }
      case 'l': { const [x, y] = nums(2); const p = pt(x, y); vertical(cur, p); horizontal(cur, p); cur = p; break; }
      case 're': {
        const [x, y, w, h] = nums(4);
        const a = pt(x, y), b = pt(x + w, y + h);
        // a thin filled rectangle is a drawn line; a cell rectangle gives its two sides
        if (Math.abs(b[0] - a[0]) < 2) vertical([(a[0] + b[0]) / 2, a[1]], [(a[0] + b[0]) / 2, b[1]]);
        else { vertical(a, [a[0], b[1]]); vertical([b[0], a[1]], b); }
        if (Math.abs(b[1] - a[1]) < 2) horizontal([a[0], (a[1] + b[1]) / 2], [b[0], (a[1] + b[1]) / 2]);
        else { horizontal(a, [b[0], a[1]]); horizontal([a[0], b[1]], b); }
        rect = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
        cur = a;
        break;
      }
      case 'q': saved.push(ctm); savedClip.push(clip); break;
      case 'Q': ctm = saved.pop() ?? ctm; clip = savedClip.length ? savedClip.pop() : clip; break;
      case 'W': case 'W*': pendingClip = true; break;
      case 'n': case 'f': case 'F': case 'f*': case 'S': case 's': case 'B': case 'B*': case 'b': case 'b*':
        // a path that is only a rectangle and ends a W is the new clip box; any other path ends the rectangle
        if (pendingClip) clip = rect;
        pendingClip = false;
        rect = undefined;
        break;
      case 'cm': ctm = mul(nums(6) as Matrix, ctm); break;
      case 'BT': tm = tlm = [1, 0, 0, 1, 0, 0]; break;
      case 'Tf': {
        const [name, sz] = stack.slice(-2);
        size = Number(sz);
        const key = isName(name) ? name.name : '';
        if (!fonts.has(key)) fonts.set(key, await loadFont(doc, fontDict[key]));
        font = fonts.get(key);
        break;
      }
      case 'Tc': charSpace = nums(1)[0]; break;
      case 'Tw': wordSpace = nums(1)[0]; break;
      case 'Tz': scale = nums(1)[0] / 100; break;
      case 'TL': leading = nums(1)[0]; break;
      case 'Ts': rise = nums(1)[0]; break;
      case 'Td': { const [tx, ty] = nums(2); tm = tlm = mul([1, 0, 0, 1, tx, ty], tlm); break; }
      case 'TD': { const [tx, ty] = nums(2); leading = -ty; tm = tlm = mul([1, 0, 0, 1, tx, ty], tlm); break; }
      case 'Tm': tm = tlm = nums(6) as Matrix; break;
      case 'T*': tm = tlm = mul([1, 0, 0, 1, 0, -leading], tlm); break;
      case 'Tj': show(String(stack[stack.length - 1] ?? '')); break;
      case "'": tm = tlm = mul([1, 0, 0, 1, 0, -leading], tlm); show(String(stack[stack.length - 1] ?? '')); break;
      case '"': { const [aw, ac] = nums(3); wordSpace = aw; charSpace = ac; tm = tlm = mul([1, 0, 0, 1, 0, -leading], tlm); show(String(stack[stack.length - 1] ?? '')); break; }
      case 'TJ': {
        const arr = stack[stack.length - 1];
        if (Array.isArray(arr))
          for (const item of arr) {
            if (typeof item === 'string') show(item);
            // a kerning number; a large negative one is a gap that a generator used for a space
            else if (typeof item === 'number') tm = mul([1, 0, 0, 1, (-item / 1000) * size * scale, 0], tm);
          }
        break;
      }
      case 'Do': {
        const name = stack[stack.length - 1];
        const xo = isName(name) ? doc.get(xobjects[name.name]) : undefined;
        if (depth < 8 && isStream(xo) && isName(xo.dict.Subtype) && xo.dict.Subtype.name === 'Form') {
          const data = await doc.data(xo);
          const m = doc.get(xo.dict.Matrix);
          const fm = (Array.isArray(m) && m.length === 6 ? m.map((x) => Number(doc.get(x))) : [1, 0, 0, 1, 0, 0]) as Matrix;
          if (data) await runContent(doc, binary(data), doc.dict(xo.dict.Resources) ?? resources, page, mul(fm, ctm), out, depth + 1);
        }
        break;
      }
      case 'BI': {
        const e = content.indexOf('EI', lx.pos);
        lx.pos = e < 0 ? content.length : e + 2;
        break;
      }
    }
    stack.length = 0;
  }
}

/** The pages in document order, each with its inherited resources. */
function pages(doc: Doc): { page: Dict; resources: Dict }[] {
  const trailerRoot = /\/Root\s+(\d+)\s+\d+\s+R/g;
  let root: Dict | undefined;
  for (let m; (m = trailerRoot.exec(doc.src)); ) root = doc.dict({ ref: [Number(m[1]), 0] }) ?? root;
  const out: { page: Dict; resources: Dict }[] = [];
  const seen = new Set<Dict>();
  const walk = (node: Dict | undefined, res: Dict | undefined) => {
    if (!node || seen.has(node)) return;
    seen.add(node);
    const resources = doc.dict(node.Resources) ?? res ?? {};
    const kids = doc.get(node.Kids);
    if (Array.isArray(kids)) kids.forEach((k) => walk(doc.dict(k), resources));
    else out.push({ page: node, resources });
  };
  walk(root && doc.dict(root.Pages), undefined);
  if (out.length) return out;
  // no usable page tree: every page object, in file order
  for (const v of doc.objects.values()) {
    const d = isStream(v) ? undefined : isDict(v) ? (v as Dict) : undefined;
    if (d && isName(d.Type) && d.Type.name === 'Page') out.push({ page: d, resources: doc.dict(d.Resources) ?? {} });
  }
  return out;
}

/** Every text piece and vertical border line of the file, page by page. */
export async function readPdfPieces(bytes: Uint8Array): Promise<Out> {
  if (!binary(bytes.subarray(0, 1024)).includes('%PDF')) throw new ImportError('import.notPdf');
  const doc = await parseObjects(bytes);
  const out: Out = { pieces: [], rules: [], hrules: [] };
  let n = 0;
  for (const { page, resources } of pages(doc)) {
    const c = doc.get(page.Contents);
    const parts = Array.isArray(c) ? c : [c];
    let content = '';
    for (const p of parts) {
      const d = await doc.data(p as Value);
      if (d) content += binary(d) + '\n';
    }
    // a page turned by /Rotate is read in its own coordinates; rows still come out as lines of the page
    await runContent(doc, content, resources, n++, [1, 0, 0, 1, 0, 0], out);
  }
  return out;
}

// ---------- layout ----------

/**
 * Some generators (an Excel table saved as a PDF) wrap a cell's text over several lines and clip each cell to its box.
 * The lines of one clip box are one cell: they become one piece spanning the box, at its middle height, so the cells of a table row,
 * drawn at different heights, fall on one line. Lines join top to bottom with a space; a fragment of one or two letters
 * or digits right after a letter or digit («ПВ1» / «П») joins without one, a word broken at the cell edge. A box taller
 * higher or wider than twenty font sizes (a page, a table or a row clip) is not a cell.
 */
function cellPieces(pieces: Piece[]): Piece[] {
  const out: Piece[] = [];
  const cells = new Map<string, Piece[]>();
  for (const p of pieces) {
    if (!p.clip || p.clip[3] - p.clip[1] > p.size * 20 || p.clip[2] - p.clip[0] > p.size * 20) { out.push(p); continue; }
    const key = `${p.page}:${p.clip.map((v) => v.toFixed(1)).join(',')}`;
    const list = cells.get(key);
    if (list) list.push(p);
    else cells.set(key, [p]);
  }
  for (const list of cells.values()) {
    const lines: Piece[][] = [];
    for (const p of [...list].sort((a, b) => b.y - a.y || a.x - b.x)) {
      const line = lines[lines.length - 1];
      if (line && Math.abs(line[0].y - p.y) <= Math.max(line[0].size, p.size) * 0.5) line.push(p);
      else lines.push([p]);
    }
    let text = '';
    for (const line of lines) {
      const t = line.sort((a, b) => a.x - b.x).map((p) => p.text).join('').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      text += !text ? t : /[\p{L}\d]$/u.test(text) && /^[\p{L}\d]{1,2}$/u.test(t) ? t : ` ${t}`;
    }
    const clip = list[0].clip!;
    out.push({
      // the box, not the text, is the cell's extent: a font without real widths would stretch the text over the next cells
      page: list[0].page, x: clip[0] + 0.5, end: clip[2] - 0.5,
      y: (clip[1] + clip[3]) / 2, size: Math.max(...list.map((p) => p.size)), text, upright: true, clip,
    });
  }
  return out;
}

/**
 * Text pieces -> a table. Lines: pieces whose baselines are within half a font size, top to bottom, page after page.
 * Words: neighbouring pieces closer than a fifth of the font size join into one cell text. Columns: the x ranges of the
 * cells of lines with three or more cells (the table body), merged where they overlap; every cell goes to the column it
 * overlaps most (or the nearest one), two cells in one column join with a space.
 */
export function layoutTable(pieces: Piece[], rules: Rule[] = [], hrules: HRule[] = []): Table {
  // rotated text (a vertical column header) is left out: it would come apart into one letter per line
  const sorted = cellPieces(pieces.filter((p) => p.text.trim() && p.upright !== false)).sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: Piece[][] = [];
  for (const p of sorted) {
    const line = lines[lines.length - 1];
    const ref = line?.[0];
    if (ref && ref.page === p.page && Math.abs(ref.y - p.y) <= Math.max(ref.size, p.size) * 0.5) line.push(p);
    else lines.push([p]);
  }
  type Seg = { x: number; end: number; text: string; clip?: Piece['clip'] };
  const cellsOf = (line: Piece[]): Seg[] => {
    const ps = [...line].sort((a, b) => a.x - b.x);
    const segs: Seg[] = [];
    for (const p of ps) {
      const last = segs[segs.length - 1];
      const gap = last ? p.x - last.end : Infinity;
      // two cell boxes side by side stay two cells however close they are
      if (last && gap < p.size * 0.2 && !(p.clip && last.clip && last.clip !== p.clip)) {
        last.text += (gap > p.size * 0.12 && !last.text.endsWith(' ') && !p.text.startsWith(' ') ? ' ' : '') + p.text;
        last.end = Math.max(last.end, p.end);
      } else segs.push({ x: p.x, end: Math.max(p.end, p.x + p.size * 0.3), text: p.text, clip: p.clip });
    }
    return segs.map((s) => ({ x: s.x, end: s.end, text: s.text.replace(/\s+/g, ' ').trim() })).filter((s) => s.text);
  };
  let rows = lines.map(cellsOf);
  const joined = joinWrapped(lines, rows, hrules, rules);
  rows = joined.rows;
  lines.splice(0, lines.length, ...joined.lines);
  const body = rows.flatMap((segs, i) => (segs.length >= 3 ? [{ page: lines[i][0].page, y: lines[i][0].y }] : []));
  const borders = borderColumns(rules, sorted, body);
  let cols: { x: number; end: number }[] = [...borders];
  if (!cols.length) for (const segs of rows) {
    if (segs.length < 3) continue;
    for (const s of segs) cols.push({ x: s.x, end: s.end });
  }
  if (!cols.length) for (const segs of rows) for (const s of segs) cols.push({ x: s.x, end: s.end });
  if (!borders.length) {
    cols.sort((a, b) => a.x - b.x);
    const merged: { x: number; end: number }[] = [];
    for (const c of cols) {
      const last = merged[merged.length - 1];
      if (last && c.x <= last.end) last.end = Math.max(last.end, c.end);
      else merged.push({ ...c });
    }
    cols = merged;
  }
  const bordered = borders.length > 0;
  const table: Table = rows.map((segs) => {
    const row: Cell[] = cols.map(() => null);
    for (const s of segs) {
      let best = -1, bestScore = -Infinity;
      // between drawn borders a cell belongs where its middle is: centred text that overflows a narrow cell («###», a
      // wrapped header) stays in it, right-aligned numbers too
      const mid = (s.x + s.end) / 2;
      const at = cols.findIndex((c) => mid >= c.x && mid < c.end);
      if (bordered && at >= 0) { const prev = row[at]; row[at] = prev === null ? s.text : `${prev} ${s.text}`; continue; }
      cols.forEach((c, i) => {
        const overlap = Math.min(c.end, s.end) - Math.max(c.x, s.x);
        const score = overlap > 0 ? overlap : -Math.min(Math.abs(c.x - s.end), Math.abs(s.x - c.end));
        if (score > bestScore) { bestScore = score; best = i; }
      });
      const prev = row[best];
      row[best] = prev === null ? s.text : `${prev} ${s.text}`;
    }
    while (row.length && row[row.length - 1] === null) row.pop();
    return row;
  });
  joined.count.forEach((n, i) => { if (n > 1) rowLines.set(table[i], n); });
  mergeHeader(table, lines);
  while (table.length && table[table.length - 1].every((c) => c === null)) table.pop();
  return table;
}

interface Seg { x: number; end: number; text: string }

/**
 * A cell's text wrapped over several lines without a clip box (ADR 0100): the lines between two drawn row borders are one
 * table row when exactly one of them is a full line (three or more cells: the number, the quantity) and the others have
 * at most two cells, each within two font sizes of the next. The other lines' cells join the anchor's cell they overlap
 * (top to bottom, with a space), or stand as cells of their own. Without row borders nothing is joined: a table with an
 * outer frame only must not become one row.
 */
function joinWrapped(lines: Piece[][], rows: Seg[][], hrules: HRule[], rules: Rule[]): { lines: Piece[][]; rows: Seg[][]; count: number[] } {
  const keep = { lines, rows, count: rows.map(() => 1) };
  if (!hrules.length) return keep;
  const band = (line: Piece[]): string | undefined => {
    const p = line[0];
    const xs = [Math.min(...line.map((q) => q.x)), Math.max(...line.map((q) => q.end))];
    const crosses = (r: HRule) => r.page === p.page && r.x0 <= xs[0] + 1 && r.x1 >= xs[0] + 1;
    let above = Infinity, below = -Infinity;
    for (const r of hrules) {
      if (!crosses(r)) continue;
      if (r.y > p.y && r.y < above) above = r.y;
      if (r.y < p.y && r.y > below) below = r.y;
    }
    return Number.isFinite(above) && Number.isFinite(below) ? `${p.page}:${above.toFixed(1)}:${below.toFixed(1)}` : undefined;
  };
  const keys = lines.map(band);
  // a band with two or more full lines is not one row (a table with an outer frame only, or no rule between rows)
  const fulls = new Map<string, number>();
  keys.forEach((k, i) => { if (k && columnsHit(lines[i], rows[i], rules) >= 3) fulls.set(k, (fulls.get(k) ?? 0) + 1); });
  const out: typeof keep = { lines: [], rows: [], count: [] };
  // cells of a line: the drawn columns its pieces fall in (a line of letters drawn one by one is many pieces, one cell)
  for (let i = 0; i < lines.length;) {
    const key = keys[i];
    let j = i + 1;
    while (key && fulls.get(key) === 1 && j < lines.length && keys[j] === key
      && lines[j - 1][0].y - lines[j][0].y <= Math.max(lines[j][0].size, lines[j - 1][0].size) * 2) j++;
    const group = rows.slice(i, j);
    const full = group.flatMap((segs, k) => (columnsHit(lines[i + k], segs, rules) >= 3 ? [k] : []));
    if (j - i < 2 || full.length !== 1) {
      for (let k = i; k < j; k++) { out.lines.push(lines[k]); out.rows.push(rows[k]); out.count.push(1); }
      i = j;
      continue;
    }
    const a = full[0];
    // with drawn columns the cells join column by column; else every other cell joins the anchor's cell it overlaps
    // (or starts one); texts in line order, then left to right
    const xs = borderXs(lines[i + a], rules);
    const parts: { x: number; end: number; col?: number; texts: { at: number; x: number; text: string }[] }[] = [];
    const order = [a, ...group.map((_, k) => k).filter((k) => k !== a)];
    for (const k of order) for (const s of group[k]) {
      const col = xs.length >= 2 ? xs.filter((x) => x <= (s.x + s.end) / 2).length : undefined;
      let best: (typeof parts)[number] | undefined, most = 0;
      for (const p of parts) {
        if (col !== undefined) { if (p.col === col) best = p; continue; }
        if (k === a) continue;
        const o = Math.min(p.end, s.end) - Math.max(p.x, s.x);
        if (o > most) { most = o; best = p; }
      }
      if (best) { best.texts.push({ at: k, x: s.x, text: s.text }); best.x = Math.min(best.x, s.x); best.end = Math.max(best.end, s.end); }
      else parts.push({ x: s.x, end: s.end, col, texts: [{ at: k, x: s.x, text: s.text }] });
    }
    const segs: Seg[] = parts
      .map((p) => ({ x: p.x, end: p.end, text: p.texts.sort((u, v) => u.at - v.at || u.x - v.x).map((t) => t.text).join(' ').replace(/\s+/g, ' ').trim() }))
      .sort((u, v) => u.x - v.x);
    // the anchor line first: its baseline is the row's
    out.lines.push([...lines[i + a], ...lines.slice(i, j).filter((_, k) => k !== a).flat()]);
    out.rows.push(segs);
    // the lines of the cell that wraps the most: the number column in a line of its own is not a wrapped line
    out.count.push(Math.max(...parts.map((p) => new Set(p.texts.map((t) => t.at)).size)));
    i = j;
  }
  return out;
}

/** x of the vertical borders that cross a line, left to right. */
function borderXs(line: Piece[], rules: Rule[]): number[] {
  const p = line[0];
  return [...new Set(rules.filter((r) => r.page === p.page && r.y0 <= p.y && r.y1 >= p.y).map((r) => Math.round(r.x)))].sort((a, b) => a - b);
}

/** The number of cells of a line: the drawn columns its cells fall in when vertical borders cross it, else its cells. */
function columnsHit(line: Piece[], segs: Seg[], rules: Rule[]): number {
  const xs = borderXs(line, rules);
  if (xs.length < 2) return segs.length;
  return new Set(segs.map((s) => xs.filter((x) => x <= (s.x + s.end) / 2).length)).size;
}

/**
 * Columns from the drawn table borders: x positions of vertical lines (grouped within 1.5 pt) that cross at least a third
 * of the table's body lines (three or more cells), so the borders of a merged header cell do not split a column; the spaces
 * between neighbouring borders that hold text are the columns. Fewer than three -> [] (the text ranges are used instead).
 */
function borderColumns(rules: Rule[], pieces: Piece[], body: { page: number; y: number }[]): { x: number; end: number }[] {
  if (!rules.length || body.length < 2) return [];
  const xs = [...rules].sort((a, b) => a.x - b.x);
  const groups: Rule[][] = [];
  for (const r of xs) {
    const g = groups[groups.length - 1];
    if (g && r.x - g[0].x <= 1.5) g.push(r);
    else groups.push([r]);
  }
  const edges = groups
    .filter((g) => body.filter((l) => g.some((r) => r.page === l.page && l.y >= r.y0 - 1 && l.y <= r.y1 + 1)).length >= body.length / 3)
    .map((g) => g.reduce((n, r) => n + r.x, 0) / g.length);
  if (edges.length < 3) return [];
  const has = (a: number, b: number) => pieces.some((p) => p.x + 0.5 >= a && p.x + 0.5 < b);
  const cols: { x: number; end: number }[] = [];
  if (has(-Infinity, edges[0])) cols.push({ x: -Infinity, end: edges[0] });
  for (let i = 0; i + 1 < edges.length; i++) if (has(edges[i], edges[i + 1])) cols.push({ x: edges[i], end: edges[i + 1] });
  if (has(edges[edges.length - 1], Infinity)) cols.push({ x: edges[edges.length - 1], end: Infinity });
  return cols.length >= 3 ? cols : [];
}

const numeric = (c: Cell) => typeof c === 'string' && /\d/.test(c) && /^[\d\s.,×xх/-]+$/i.test(c);

/**
 * A header cell wraps over several lines in a PDF («Довжина,» / «мм»); the column mapping reads one header row. The text
 * lines right above the first table line (three or more cells, two of them numbers), each within two font sizes of the next
 * and with fewer than two number cells, are joined column by column into the last of them; the lines above become empty rows. Letters
 * stacked one per line (a vertical header) join without spaces.
 */
function mergeHeader(table: Table, lines: Piece[][]) {
  const numbers = (r: Cell[]) => r.filter(numeric).length >= 2;
  const body = table.findIndex((r) => r.filter((c) => c !== null).length >= 3 && numbers(r));
  // section lines right above the body («Вентиляція», «ПВ1»: one cell of more than one letter) stay rows of their own
  let end = body;
  const section = (r: Cell[]) => { const f = r.filter((c) => c !== null); return f.length === 1 && String(f[0]).length > 1; };
  while (end > 0 && section(table[end - 1])) end--;
  if (end <= 0 || numbers(table[end - 1])) return;
  let top = end - 1;
  while (top > 0) {
    const a = lines[top - 1][0], b = lines[top][0];
    if (a.page !== b.page || a.y - b.y > Math.max(a.size, b.size) * 2.2 || numbers(table[top - 1])) break;
    top--;
  }
  if (top === end - 1) return;
  const width = Math.max(...table.slice(top, end).map((r) => r.length));
  const merged: Cell[] = [];
  for (let c = 0; c < width; c++) {
    let text = '';
    for (let r = top; r < end; r++) {
      const v = table[r][c];
      if (v === null || v === undefined) continue;
      const t = String(v);
      // a word broken by a hyphen («Кол-» / «во») and stacked single letters join without a space
      const glue = !text || text.endsWith('-') || (/^\p{L}$/u.test(t) && /(^|\s)\p{L}+$/u.test(text) && /\p{L}$/u.test(text) && t.length === 1 && lastWordStacked(text));
      text += glue ? t : ` ${t}`;
    }
    merged.push(text || null);
  }
  while (merged.length && merged[merged.length - 1] === null) merged.pop();
  for (let r = top; r < end - 1; r++) table[r] = [];
  table[end - 1] = merged;
}

/** True while the text is being built from letters stacked one per line (the cell started with a single letter). */
const lastWordStacked = (text: string) => /^\p{L}+$/u.test(text);

/** The tables of a PDF as one table (pages one after another). A PDF with no text (a scan) is `import.pdfNoText`. */
export async function readPdf(bytes: Uint8Array): Promise<Table> {
  const { pieces, rules, hrules } = await readPdfPieces(bytes);
  if (!pieces.some((p) => p.text.trim())) throw new ImportError('import.pdfNoText');
  const table = layoutTable(pieces, rules, hrules);
  if (!table.length) throw new ImportError('import.empty');
  return table;
}
