/**
 * A small reader for spec tables in a PDF, in the browser only (ADR 0096): the file never leaves the device, no dependency.
 * It reads text PDFs (exported from Excel, LibreOffice, AutoCAD, a browser's «print to PDF»), not scans: a scan has no text.
 * Steps: the objects (also inside object streams), FlateDecode streams through the platform's DecompressionStream, the page
 * tree in order, each page's content stream run as text operators with the fonts' ToUnicode maps and widths, then the text
 * pieces are laid out into lines (by y) and columns (x ranges shared by the table lines), which gives the same `Table` as
 * the .xlsx reader, so the column mapping and the preview are the same.
 */
import { ImportError, type Cell, type Table } from './xlsx';

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
  const fallback = (c: number) => diffs.get(c) ?? (type0 ? '' : winAnsi[c] ?? (c >= 32 ? String.fromCharCode(c) : ''));
  return { bytes, toUnicode, width, fallback };
}

// ---------- content streams ----------

/** A run of text on a page, in page space: start x, baseline y, end x, font size. */
export interface Piece { page: number; x: number; y: number; end: number; size: number; text: string; /** false for rotated text (a vertical header) */ upright?: boolean }

/** A vertical line of a table border on a page, in page space. */
export interface Rule { page: number; x: number; y0: number; y1: number }

interface Out { pieces: Piece[]; rules: Rule[] }

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
  let size = 1, leading = 0, charSpace = 0, wordSpace = 0, scale = 1, rise = 0;
  const nums = (n: number) => stack.slice(-n).map(Number);
  // path construction: vertical segments and the sides of rectangles are the table's column borders
  let cur: [number, number] = [0, 0];
  const pt = (x: number, y: number): [number, number] => [x * ctm[0] + y * ctm[2] + ctm[4], x * ctm[1] + y * ctm[3] + ctm[5]];
  const vertical = (a: [number, number], b: [number, number]) => {
    if (Math.abs(a[0] - b[0]) < 0.8 && Math.abs(a[1] - b[1]) > 4) out.rules.push({ page, x: (a[0] + b[0]) / 2, y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) });
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
    if (text.length) out.pieces.push({ page, x, y, end: Math.max(end, x), size: fs, text, upright });
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
      case 'l': { const [x, y] = nums(2); const p = pt(x, y); vertical(cur, p); cur = p; break; }
      case 're': {
        const [x, y, w, h] = nums(4);
        const a = pt(x, y), b = pt(x + w, y + h);
        // a thin filled rectangle is a drawn line; a cell rectangle gives its two sides
        if (Math.abs(b[0] - a[0]) < 2) vertical([(a[0] + b[0]) / 2, a[1]], [(a[0] + b[0]) / 2, b[1]]);
        else { vertical(a, [a[0], b[1]]); vertical([b[0], a[1]], b); }
        cur = a;
        break;
      }
      case 'q': saved.push(ctm); break;
      case 'Q': ctm = saved.pop() ?? ctm; break;
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
  const out: Out = { pieces: [], rules: [] };
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
 * Text pieces -> a table. Lines: pieces whose baselines are within half a font size, top to bottom, page after page.
 * Words: neighbouring pieces closer than a fifth of the font size join into one cell text. Columns: the x ranges of the
 * cells of lines with three or more cells (the table body), merged where they overlap; every cell goes to the column it
 * overlaps most (or the nearest one), two cells in one column join with a space.
 */
export function layoutTable(pieces: Piece[], rules: Rule[] = []): Table {
  // rotated text (a vertical column header) is left out: it would come apart into one letter per line
  const sorted = pieces.filter((p) => p.text.trim() && p.upright !== false).sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: Piece[][] = [];
  for (const p of sorted) {
    const line = lines[lines.length - 1];
    const ref = line?.[0];
    if (ref && ref.page === p.page && Math.abs(ref.y - p.y) <= Math.max(ref.size, p.size) * 0.5) line.push(p);
    else lines.push([p]);
  }
  type Seg = { x: number; end: number; text: string };
  const cellsOf = (line: Piece[]): Seg[] => {
    const ps = [...line].sort((a, b) => a.x - b.x);
    const segs: Seg[] = [];
    for (const p of ps) {
      const last = segs[segs.length - 1];
      const gap = last ? p.x - last.end : Infinity;
      if (last && gap < p.size * 0.2) {
        last.text += (gap > p.size * 0.12 && !last.text.endsWith(' ') && !p.text.startsWith(' ') ? ' ' : '') + p.text;
        last.end = Math.max(last.end, p.end);
      } else segs.push({ x: p.x, end: Math.max(p.end, p.x + p.size * 0.3), text: p.text });
    }
    return segs.map((s) => ({ ...s, text: s.text.replace(/\s+/g, ' ').trim() })).filter((s) => s.text);
  };
  const rows = lines.map(cellsOf);
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
  mergeHeader(table, lines);
  while (table.length && table[table.length - 1].every((c) => c === null)) table.pop();
  return table;
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
  const { pieces, rules } = await readPdfPieces(bytes);
  if (!pieces.some((p) => p.text.trim())) throw new ImportError('import.pdfNoText');
  const table = layoutTable(pieces, rules);
  if (!table.length) throw new ImportError('import.empty');
  return table;
}
