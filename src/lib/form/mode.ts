/** Interface mode (ADR 0082): simple shows sizes, quantity and areas; advanced adds every setting, insulation and price. */
export const modes = ['simple', 'advanced'] as const;
export type Mode = (typeof modes)[number];

/** Until the user picks one the page stays as it was before the modes: advanced. */
export const defaultMode: Mode = 'advanced';

/** A stored value back to a mode; anything unknown is the default. */
export function toMode(value: string | null | undefined): Mode {
  return modes.find((m) => m === value) ?? defaultMode;
}
