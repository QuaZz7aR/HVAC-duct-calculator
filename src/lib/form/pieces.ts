/** A straight split into shop pieces: `full` pieces of `pieceMm` plus one `restMm` piece (0 = none). ADR 0045. */
export interface Pieces {
  full: number;
  pieceMm: number;
  restMm: number;
}

/** Splits a straight of `lengthMm` into pieces no longer than `maxMm`; the area is unchanged. Null when no split is asked or none is needed. */
export function splitLength(lengthMm: number, maxMm: number | undefined): Pieces | null {
  if (!(maxMm !== undefined && maxMm > 0) || !(lengthMm > maxMm)) return null;
  // a tiny float leftover (e.g. 9000 / 3000) is no extra piece
  const eps = 1e-6;
  const full = Math.floor((lengthMm + eps) / maxMm);
  const rest = lengthMm - full * maxMm;
  return { full, pieceMm: maxMm, restMm: rest > eps ? rest : 0 };
}
