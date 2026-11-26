import type { FittingKind } from '../form/fields';

/**
 * Fitting kinds from the names and codes people put in their own spec tables (ADR 0061): the engineer's Excel codes
 * (КВ, ПО, КККр...), this site's Ukrainian and English designations, and plain words in Ukrainian and Russian
 * («Відвід», «Тройник»). A word only says the family (elbow, tee...); round or rect then comes from the sizes in the name.
 */

/** Size of a duct end read from a name: a diameter or width x height, in mm. */
export type NameSize = { d: number } | { w: number; h: number };

export interface NameParse {
  sizes: NameSize[];
  /** Elbow angle in degrees, when the name has one (90°, «КО 90 Д150»). */
  angle?: number;
  /** Part length in mm («l150мм», «L=300»). */
  length?: number;
  /** Offset (утка) shift in mm («подъем на 120мм», «зміщення 100»), ADR 0113. */
  offset?: number;
}

type Family = 'straight' | 'elbow' | 'reducer' | 'cap' | 'tap' | 'tee' | 'cross' | 'offset' | 'box';

// codes, compared in upper case; the engineer's Excel first, then this site's designations (uk and en)
const codes: Record<string, FittingKind | Family> = {
  'КВ': 'roundStraight', 'СНВ': 'straight', 'КНІП': 'roundStraight', 'НІП': 'roundStraight', 'НІПЕЛЬ': 'roundStraight', 'КПВ': 'roundStraight',
  'ПВ': 'rectStraight', 'ППВ': 'rectStraight',
  'КО': 'roundElbow', 'КВД': 'roundElbow', 'ПО': 'rectElbow', 'ПВД': 'rectElbow',
  'КП': 'roundReducer', 'ПП': 'rectReducer', 'ППК': 'rectToRoundReducer', 'ПКП': 'rectToRoundReducer',
  'КЗ': 'roundCap', 'ПЗ': 'rectCap',
  'КВР': 'roundTap', 'ПВР': 'rectTap',
  'КТ': 'roundTee', 'КПТ': 'roundTeeRectBranch', 'ПТ': 'rectTee', 'ПКТ': 'rectTeeRoundBranch',
  'ККХ': 'roundCross', 'КККР': 'roundCross', 'ККР': 'roundCross',
  'КПХ': 'roundCrossRectBranches', 'КПКР': 'roundCrossRectBranches',
  'ППХ': 'rectCross', 'ППКР': 'rectCross',
  'ПКХ': 'rectCrossRoundBranches', 'ПККР': 'rectCrossRoundBranches',
  CD: 'roundStraight', RD: 'rectStraight', CE: 'roundElbow', RE: 'rectElbow', CR: 'roundReducer', RR: 'rectReducer',
  RC: 'rectToRoundReducer', CTAP: 'roundTap', RTAP: 'rectTap', CAP: 'cap', CT: 'roundTee', CRT: 'roundTeeRectBranch',
  // BETA kinds (ADR 0113)
  'ПА': 'rectBox', 'КУ': 'roundOffset', 'ПУ': 'rectOffset', RA: 'rectBox', CO: 'roundOffset', RO: 'rectOffset',
  RT: 'rectTee', RCT: 'rectTeeRoundBranch', CX: 'roundCross', CRX: 'roundCrossRectBranches', RX: 'rectCross', RCX: 'rectCrossRoundBranches',
};

// word stems, Ukrainian and Russian, matched at the start of a word in lower case
const words: [RegExp, Family][] = [
  [/^(повітропров|воздуховод|ніпел|нипел|duct)/, 'straight'],
  [/^(відвід|відвод|отвод|elbow|bend)/, 'elbow'],
  [/^(перехід|переход|reducer|transition)/, 'reducer'],
  [/^(заглуш|cap)/, 'cap'],
  [/^(врізк|врезк|tap)/, 'tap'],
  [/^(трійник|тройник|tee)/, 'tee'],
  [/^(хрестовин|крестовин|cross)/, 'cross'],
];

// parts a name word never matches (ADR 0061): «Адаптер ..., 2 врізки» must not become a tap. The beta kinds of ADR 0113
// (адаптер / короб, утка) are recognised by their codes only (ПА, КУ, ПУ): matching them by name changes pinned import tests,
// which waits for the owner (TODO(confirm)).
const notOurs = /утк|адаптер|короб|дифуз|диффуз|решітк|решетк|клапан|шумоглуш|offset|adapter|plenum/i;

// a hood over kitchen equipment is a cap by its metal: lid A x B plus a rim (ADR 0079); the name wins over a code such as ПП
const hood = /зонт|парасольк|(?<!\p{L})hood/iu;

// Latin letters typed in place of their Cyrillic look-alikes (KB, ПO) in a code
const lookAlike: Record<string, string> = { A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', I: 'І', K: 'К', M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х' };

/** The kind or family of one code, or undefined. */
function codeOf(token: string): FittingKind | Family | undefined {
  const t = token.trim().toUpperCase().replace(/[.:]$/, '');
  if (!t) return undefined;
  if (codes[t]) return codes[t];
  const cyr = [...t].map((c) => lookAlike[c] ?? c).join('');
  return codes[cyr];
}

const num = String.raw`(\d+(?:[.,]\d+)?)`;
// a diameter letter only at the start of a word («Д150», not the «д» ending «Переход 400»)
const sizeRe = new RegExp(String.raw`(?:(?<!\p{L})[ДдDdØø⌀Ф]\s*${num})|(?:${num}\s*[xXхХ×*]\s*${num})|(?:(?<=[ДдDdØø⌀Ф]\s*\d+(?:[.,]\d+)?\s*\/\s*)${num}(?![\d.,]*\s*[xXхХ×*]))`, 'gu');
const toNum = (s: string) => Number(s.replace(',', '.'));

/** Sizes, angle and length written in a name such as «КО 90 Д150», «ППК Д200/400х200», «550х350/500х300 l150мм». */
export function parseName(name: string): NameParse {
  const sizes: NameSize[] = [];
  let rest = name;
  for (const m of name.matchAll(sizeRe)) {
    if (m[1] !== undefined) sizes.push({ d: toNum(m[1]) });
    else if (m[2] !== undefined) sizes.push({ w: toNum(m[2]), h: toNum(m[3]) });
    // a bare number after a diameter and a slash is a second diameter («Д200/160»)
    else sizes.push({ d: toNum(m[4]) });
    rest = rest.replace(m[0], ' ');
  }
  const out: NameParse = { sizes };
  const length = new RegExp(String.raw`(?:^|[\s,(])[lLлЛ]\s*=?\s*${num}\s*(?:мм|mm)?`).exec(rest);
  if (length) { out.length = toNum(length[1]); rest = rest.replace(length[0], ' '); }
  const shift = new RegExp(String.raw`(?:подъ[её]м|підйом|підйому|смещени[ея]|зміщення|offset)\s*(?:на\s*)?=?\s*${num}`, 'iu').exec(rest);
  if (shift) { out.offset = toNum(shift[1]); rest = rest.replace(shift[0], ' '); }
  // an angle with its sign, or a bare common elbow angle («КО 90 Д150»); another bare number is a type or a count, not an angle
  const marked = new RegExp(String.raw`${num}\s*(?:°|град|deg)`).exec(rest);
  const bare = new RegExp(String.raw`(?:^|\s)(15|30|45|60|75|90)(?=\s|$)`).exec(rest);
  const a = marked ? toNum(marked[1]) : bare ? toNum(bare[1]) : undefined;
  if (a !== undefined && a > 0 && a <= 180) out.angle = a;
  return out;
}

const isRound = (s: NameSize | undefined) => s !== undefined && 'd' in s;

/** A family resolved to a kind by the shapes of the sizes (main end first, then the small end or the branch). */
function byShape(family: Family, sizes: NameSize[]): FittingKind | undefined {
  if (!sizes.length) return undefined;
  const main = sizes[0];
  const other = sizes[1];
  switch (family) {
    case 'straight': return isRound(main) ? 'roundStraight' : 'rectStraight';
    case 'elbow': return isRound(main) ? 'roundElbow' : 'rectElbow';
    case 'cap': return isRound(main) ? 'roundCap' : 'rectCap';
    case 'tap': return isRound(main) ? 'roundTap' : 'rectTap';
    case 'offset': return isRound(main) ? 'roundOffset' : 'rectOffset';
    case 'box': return isRound(main) ? undefined : 'rectBox';
    case 'reducer':
      if (!other) return undefined;
      if (isRound(main) && isRound(other)) return 'roundReducer';
      if (!isRound(main) && !isRound(other)) return 'rectReducer';
      return 'rectToRoundReducer';
    case 'tee':
      if (isRound(main)) return !other || isRound(other) ? 'roundTee' : 'roundTeeRectBranch';
      return !other || !isRound(other) ? 'rectTee' : 'rectTeeRoundBranch';
    case 'cross':
      if (isRound(main)) return !other || isRound(other) ? 'roundCross' : 'roundCrossRectBranches';
      return !other || !isRound(other) ? 'rectCross' : 'rectCrossRoundBranches';
  }
}

const isFamily = (k: FittingKind | Family): k is Family => !/^(round|rect)/.test(k);

/**
 * The kind of a row from its code cell and its name. The code cell wins; a bare family code (СНВ, Cap) or a word in
 * the name is resolved by the sizes. Undefined when nothing is recognised: the row is shown for a manual choice.
 */
export function recognizeKind(code: string | undefined, name: string | undefined, sizes: NameSize[]): FittingKind | undefined {
  if (name && hood.test(name)) return byShape('cap', sizes);
  const fromCode = code ? codeOf(code) : undefined;
  if (fromCode && !isFamily(fromCode)) return fromCode;
  if (fromCode) return byShape(fromCode, sizes);
  if (!name) return undefined;
  if (notOurs.test(name)) return undefined;
  const tokens = name.split(/[\s,;()]+/).filter(Boolean);
  // the first token may be a code («КО 90 Д150»); a code anywhere else is too risky (a «ПП» inside a description)
  const first = tokens[0] && codeOf(tokens[0]);
  if (first) return isFamily(first) ? byShape(first, sizes) : first;
  // the family word comes early («Кругла заглушка», «Прямокутний на круглий перехід»); later words describe the part
  for (const t of tokens.slice(0, 4)) {
    const w = t.toLowerCase();
    const family = words.find(([re]) => re.test(w))?.[1];
    if (family) return byShape(family, sizes);
  }
  return undefined;
}
