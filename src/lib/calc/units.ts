/** The only place where boundary units (mm) are converted to SI (m). */
export const mmToM = (mm: number): number => mm / 1000;

/** Degrees to radians; the only place angles are converted. */
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
