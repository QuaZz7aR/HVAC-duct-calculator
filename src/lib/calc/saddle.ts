/**
 * Saddle of a branch on a round main duct (ADR 0118): the branch wall follows the curve of the main, so its developed
 * pattern is longer by the sag of the main surface under each point of the branch perimeter. In m2; inputs in m.
 * The branch is never wider than the main here: a larger branch is clamped to the main (it is warned about elsewhere).
 */

/** Sag of a circle of radius R at the distance x from its top line: R - sqrt(R^2 - x^2). */
const sag = (R: number, x: number) => R - Math.sqrt(Math.max(0, R * R - x * x));

/** Round branch of radius r on a main of radius R: r times the integral of the sag over the branch circle (Simpson, 128 steps). */
export function roundSaddle(R: number, r: number): number {
  const rr = Math.min(r, R);
  const n = 128;
  const h = (2 * Math.PI) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
    s += w * sag(R, rr * Math.sin(i * h));
  }
  return rr * (s * h) / 3;
}

/**
 * Rect branch on a main of radius R: `along` runs with the main axis, `across` around it. The two walls across the main
 * follow the arc (integral of the sag over the width), the two walls along it are cut at the sag of their edge line.
 */
export function rectSaddle(R: number, along: number, across: number): number {
  const a = Math.min(across, 2 * R) / 2;
  // integral of sqrt(R^2 - x^2) over [-a, a]
  const chordArea = a * Math.sqrt(R * R - a * a) + R * R * Math.asin(a / R);
  const acrossWalls = 2 * (2 * a * R - chordArea);
  return acrossWalls + 2 * along * sag(R, a);
}
