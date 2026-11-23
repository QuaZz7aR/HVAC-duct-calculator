/** Interface mode (ADR 0082): simple shows sizes, quantity and areas; advanced adds every setting, insulation and price. */
export const modes = ['simple', 'advanced'] as const;
export type Mode = (typeof modes)[number];

/** A first visit opens the simple mode (owner, 2026-11-23). */
export const defaultMode: Mode = 'simple';

/** A stored value back to a mode; anything unknown is the default. */
export function toMode(value: string | null | undefined): Mode {
  return modes.find((m) => m === value) ?? defaultMode;
}
