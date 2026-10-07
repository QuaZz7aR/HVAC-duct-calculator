/** The only place where boundary units (mm) are converted to SI (m). */
export const mmToM = (mm: number): number => mm / 1000;

/** Airflow m3/h to m3/s. */
export const m3hToM3s = (m3h: number): number => m3h / 3600;

/** Degrees to radians; the only place angles are converted. */
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
