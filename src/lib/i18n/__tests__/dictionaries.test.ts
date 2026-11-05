import { describe, expect, it } from 'vitest';
import { kindOrder } from '../../form/fields';
import { searchKinds } from '../../form/kind-groups';
import { warningMessage } from '../../form/messages';
import { en } from '../en';
import { dictionaries, toLang } from '../index';
import { uk } from '../uk';

/** Paths of every leaf, with the kind of value at it, so a missing or mistyped key in a language shows up. */
function shape(o: unknown, path = ''): string[] {
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => shape(v, `${path}.${k}`));
  return [`${path}:${typeof o}`];
}

describe('dictionaries', () => {
  it('en has exactly the keys of uk', () => {
    expect(shape(en).sort()).toEqual(shape(uk).sort());
  });

  it('every language has non-empty strings', () => {
    for (const d of Object.values(dictionaries)) {
      for (const k of kindOrder) expect(d.kinds[k].name.length).toBeGreaterThan(0);
      expect(d.appTitle.length).toBeGreaterThan(0);
    }
  });

  it('size letters are shared between languages', () => {
    expect(en.symbols).toEqual(uk.symbols);
  });

  it('English codes are unique except the two caps', () => {
    const codes = kindOrder.map((k) => en.kinds[k].designation).filter((c) => c !== 'Cap');
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('unknown stored values fall back to Ukrainian', () => {
    expect(toLang('en')).toBe('en');
    expect(toLang('uk')).toBe('uk');
    expect(toLang('de')).toBe('uk');
    expect(toLang(null)).toBe('uk');
  });

  it('warning numbers use the decimal mark of the language', () => {
    const w = { code: 'aspect.excessive', level: 'strong', value: 7.5, limit: 6.3 } as const;
    expect(warningMessage(w, en)).toContain('7.5');
    expect(warningMessage(w, uk)).toContain('7,5');
  });

  it('search looks in the names of the given language', () => {
    expect(searchKinds('elbow', en).flatMap((g) => g.kinds)).toEqual(['roundElbow', 'rectElbow']);
    expect(searchKinds('elbow', uk)).toEqual([]);
  });
});
