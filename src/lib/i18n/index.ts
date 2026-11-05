import { en } from './en';
import { uk, type Dictionary } from './uk';

export type Lang = 'uk' | 'en';
export const langs: readonly Lang[] = ['uk', 'en'];
export const defaultLang: Lang = 'uk';
export const dictionaries: Record<Lang, Dictionary> = { uk, en };

/** A stored value that is not a known language falls back to the default. */
export const toLang = (value: string | null | undefined): Lang => (langs as readonly string[]).includes(value ?? '') ? (value as Lang) : defaultLang;

export type { Dictionary };
