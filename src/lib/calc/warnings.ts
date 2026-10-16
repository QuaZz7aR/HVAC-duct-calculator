import type { CalcConfig } from './config';
import type { Fitting } from './types';

/** Non-blocking advice about a valid fitting. Never changes a size and never stops the calculation. */
export type WarningCode = 'aspect.high' | 'aspect.excessive' | 'size.overLimit' | 'elbow.radiusLarge';

export interface FittingWarning {
  code: WarningCode;
  /** 'strong' = outside what the norm allows; 'warning' = unusual, check it. */
  level: 'warning' | 'strong';
  value: number; // what was found (ratio or mm)
  limit: number; // the threshold it crossed (ratio or mm)
}

/** Rectangular cross-sections of the fitting (both ends of a reducer, the rect end of rect-to-round). */
function rectEnds(f: Fitting): { w: number; h: number }[] {
  switch (f.kind) {
    case 'rectStraight':
    case 'rectCap':
    case 'rectElbow':
    case 'rectToRoundReducer':
      return [{ w: f.width, h: f.height }];
    case 'rectReducer':
      return [
        { w: f.width, h: f.height },
        { w: f.smallWidth, h: f.smallHeight },
      ];
    default:
      return [];
  }
}

/** Every cross-section dimension of the fitting, mm. */
function allSizes(f: Fitting): number[] {
  const sizes = rectEnds(f).flatMap((e) => [e.w, e.h]);
  if ('diameter' in f) sizes.push(f.diameter);
  if ('smallDiameter' in f) sizes.push(f.smallDiameter);
  return sizes;
}

/**
 * Inner bend radius and the cross-section size it is compared with (mm).
 * Rect: innerRadius against the bend-plane side. Round: the input is the center radius, inner = center - D / 2.
 */
function elbowInner(f: Fitting): { inner: number; size: number } | undefined {
  if (f.kind === 'rectElbow') return { inner: f.innerRadius, size: f.width };
  if (f.kind === 'roundElbow') return { inner: f.centerRadius - f.diameter / 2, size: f.diameter };
  return undefined;
}

export function fittingWarnings(fitting: Fitting, config: CalcConfig): FittingWarning[] {
  const { aspectRatioWarn, aspectRatioMax, maxSizeMm, elbowInnerRadiusFactor } = config.warnings;
  const out: FittingWarning[] = [];

  // worst aspect ratio over the rect ends; a strong warning replaces the plain one
  const ratios = rectEnds(fitting).map((e) => Math.max(e.w, e.h) / Math.min(e.w, e.h));
  const ratio = Math.max(0, ...ratios);
  if (ratio > aspectRatioMax) out.push({ code: 'aspect.excessive', level: 'strong', value: ratio, limit: aspectRatioMax });
  else if (ratio >= aspectRatioWarn) out.push({ code: 'aspect.high', level: 'warning', value: ratio, limit: aspectRatioWarn });

  const biggest = Math.max(...allSizes(fitting));
  if (biggest > maxSizeMm) out.push({ code: 'size.overLimit', level: 'warning', value: biggest, limit: maxSizeMm });

  const bend = elbowInner(fitting);
  if (bend && bend.inner > elbowInnerRadiusFactor * bend.size) {
    out.push({ code: 'elbow.radiusLarge', level: 'warning', value: bend.inner, limit: elbowInnerRadiusFactor * bend.size });
  }
  return out;
}
