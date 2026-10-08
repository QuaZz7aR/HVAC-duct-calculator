/**
 * Reference values for section assembly: one fitting + flow + zeta -> metal area, centerline, pressure drop.
 * SOURCE OF TRUTH - do not edit expected values to make a test pass.
 *
 * Boundary in: mm, m3/h, dimensionless zeta (as in the other fixtures).
 * Result out (SI): metalArea m2 (incl. waste factor), centerlineLength m, pressureDrop in Pa / m/s.
 * Air = `air` from aero.fixtures.ts, roughness = defaultConfig.roughnessMm (0.1 mm).
 *
 * Every number is derived from already verified fixtures (see `derivation`):
 *  - metalArea: sheet-area.fixtures.ts x waste-factor.fixtures.ts
 *  - centerline: centerlineCases / axial length for reducers (TODO(confirm) in code)
 *  - pressureDrop: aero.fixtures.ts where the case matches it, otherwise recomputed with the same model
 *    (Altshul, Math.PI - so these do NOT carry the Excel pi = 3.14 artefact, tolerance is still AERO_REL_TOLERANCE).
 *
 * Reducers (decided default, TODO(confirm)): friction as in the Excel -
 * hydraulic diameter of the LARGER end, velocity = arithmetic mean of the velocities at both ends,
 * Pd = rho * vMean^2 / 2 used for friction AND local loss. Non-reducers use their own section velocity.
 */
import type { Fitting, PressureDrop } from '../types';

export interface SectionCase {
    id: string;
    input: { fitting: Fitting; flow: number; localCoefficient: number };
    expected: { metalArea: number; centerlineLength: number; pressureDrop: PressureDrop };
    basis: 'geometry' | 'excel';
    derivation: string;
}

export const sectionCases: SectionCase[] = [
    {
        id: 'round-straight-d150-1m',
        input: { fitting: { kind: 'roundStraight', diameter: 150, length: 1000 }, flow: 265, localCoefficient: 0.218 },
        expected: {
            metalArea: 0.471238898,
            centerlineLength: 1.0,
            pressureDrop: { velocity: 4.17, reynolds: 41273.40052, dynamicPressure: 10.3918347, frictionFactor: 0.024126465, frictionLoss: 1.67145493, localLoss: 2.26542 },
        },
        basis: 'geometry',
        derivation: 'aero round-d150 as is; metal = sheet-area round-straight-d150-1m x 1.0',
    },
    {
        id: 'rect-straight-350x150-450',
        input: { fitting: { kind: 'rectStraight', width: 350, height: 150, length: 450 }, flow: 800, localCoefficient: 0.45 },
        expected: {
            metalArea: 0.45,
            centerlineLength: 0.45,
            pressureDrop: { velocity: 4.23, reynolds: 58686.10308, dynamicPressure: 10.7192944, frictionFactor: 0.022118991, frictionLoss: 0.508071385, localLoss: 4.82368 },
        },
        basis: 'geometry',
        derivation: 'aero rect-350x150 as is; metal = 2 * (0.35 + 0.15) * 0.45 = 0.45 (x 1.0)',
    },
    {
        id: 'round-elbow-d150-r150-90',
        input: { fitting: { kind: 'roundElbow', diameter: 150, centerRadius: 150, angle: 90, allowance: 50 }, flow: 265, localCoefficient: 0.35 },
        expected: {
            metalArea: 0.18188048,
            centerlineLength: 0.235619449,
            pressureDrop: { velocity: 4.165536782, reynolds: 41253.830538, dynamicPressure: 10.381300627, frictionFactor: 0.024128502, frictionLoss: 0.393461285, localLoss: 3.633455219 },
        },
        basis: 'geometry',
        derivation:
            'metal: developed = 0.15 * pi/2 + 2 * 0.05 = 0.335619449 m; sheet = pi * 0.15 * 0.335619449 = 0.158156939; D = 150 < 315 -> x 1.15 = 0.181880480. ' +
            'centerline = 0.15 * pi/2 = 0.235619449 (no allowance). v = (265/3600) / (pi * 0.15^2 / 4) = 4.165536782; Re = v * 0.15 / 1.5146e-5; Pd = 1.1965747 * v^2 / 2; ' +
            'lambda = 0.11 * (0.0001/0.15 + 68/Re)^0.25; friction = lambda * 0.235619449 / 0.15 * Pd; local = 0.35 * Pd. Same flow and d as aero round-d150 (Pd differs by 0.1 %: that one has pi = 3.14).',
    },
    {
        id: 'rect-elbow-350x150-r125-90',
        input: { fitting: { kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50 }, flow: 800, localCoefficient: 0.3 },
        expected: {
            metalArea: 0.685486678,
            centerlineLength: 0.471238898,
            pressureDrop: { velocity: 4.23, reynolds: 58686.10308, dynamicPressure: 10.7192944, frictionFactor: 0.022118991, frictionLoss: 0.532051103, localLoss: 3.21578832 },
        },
        basis: 'excel',
        derivation:
            'metal = waste-factor rect-elbow-350x150-r125-90 (Dh 210 -> x 1.2). centerline = (0.125 + 0.35/2) * pi/2 = 0.471238898. ' +
            'Same section 350x150 and flow 800 as aero rect-350x150, so Pd and lambda are taken from it: friction = 0.022118991 * 0.471238898 / 0.21 * 10.7192944 = 0.532051103; local = 0.3 * 10.7192944. basis excel: inner radius convention.',
    },
    {
        id: 'rect-cap-350x150',
        input: { fitting: { kind: 'rectCap', width: 350, height: 150, length: 50 }, flow: 800, localCoefficient: 1.0 },
        expected: {
            metalArea: 0.1025,
            centerlineLength: 0,
            pressureDrop: { velocity: 4.23, reynolds: 58686.10308, dynamicPressure: 10.7192944, frictionFactor: 0.022118991, frictionLoss: 0, localLoss: 10.7192944 },
        },
        basis: 'excel',
        derivation: 'metal = sheet-area rect-cap-350x150 x 1.0. centerline 0 (TODO(confirm)) -> friction 0; local = 1.0 * Pd of aero rect-350x150. lambda is still reported.',
    },
    {
        id: 'round-reducer-d150-d100-L150',
        input: { fitting: { kind: 'roundReducer', diameter: 150, smallDiameter: 100, length: 150, allowance: 50 }, flow: 265, localCoefficient: 0.1 },
        expected: {
            metalArea: 0.09898729,
            centerlineLength: 0.15,
            pressureDrop: { velocity: 6.768997271, reynolds: 67037.474624, dynamicPressure: 27.413121968, frictionFactor: 0.022273384, frictionLoss: 0.610582997, localLoss: 2.741312197 },
        },
        basis: 'excel',
        derivation:
            'metal = sheet-area round-reducer-d150-d100 x 1.0. centerline = axial 0.15. v1 = (265/3600)/(pi*0.15^2/4) = 4.165536782, v2 = (265/3600)/(pi*0.1^2/4) = 9.372457760, vMean = 6.768997271. ' +
            'd = 0.15 (larger end). Re = vMean * 0.15 / 1.5146e-5; Pd = 1.1965747 * vMean^2 / 2; friction = lambda * 0.15 / 0.15 * Pd; local = 0.1 * Pd.',
    },
    {
        id: 'rect-reducer-600x400-400x300-L400',
        input: {
            fitting: { kind: 'rectReducer', width: 600, height: 400, smallWidth: 400, smallHeight: 300, length: 400, allowance: 50 },
            flow: 1500,
            localCoefficient: 0.1,
        },
        expected: {
            metalArea: 0.8617305,
            centerlineLength: 0.4,
            pressureDrop: { velocity: 2.604166667, reynolds: 82530.040935, dynamicPressure: 4.057395766, frictionFactor: 0.019717035, frictionLoss: 0.066666513, localLoss: 0.405739577 },
        },
        basis: 'excel',
        derivation:
            'metal = sheet-area rect-reducer-600x400-400x300 x 1.0. centerline = axial 0.4. v1 = (1500/3600)/(0.6*0.4) = 1.736111, v2 = (1500/3600)/(0.4*0.3) = 3.472222, vMean = 2.604167. ' +
            'd = 2*0.6*0.4/(0.6+0.4) = 0.48 (larger end by Dh; small end Dh = 0.342857). Re = vMean * 0.48 / 1.5146e-5; friction = lambda * 0.4 / 0.48 * Pd; local = 0.1 * Pd.',
    },
    {
        id: 'rect-to-round-200x150-d150-L250',
        input: { fitting: { kind: 'rectToRoundReducer', width: 200, height: 150, smallDiameter: 150, length: 250, allowance: 50 }, flow: 400, localCoefficient: 0.1 },
        expected: {
            metalArea: 0.205697011,
            centerlineLength: 0.25,
            pressureDrop: { velocity: 4.995653197, reynolds: 56542.829189, dynamicPressure: 14.931188681, frictionFactor: 0.022613132, frictionLoss: 0.492393029, localLoss: 1.493118868 },
        },
        basis: 'excel',
        derivation:
            'metal = sheet-area rect-to-round-200x150-d150 x 1.0. centerline = axial 0.25. v1 = (400/3600)/(0.2*0.15) = 3.703704, v2 = (400/3600)/(pi*0.15^2/4) = 6.287603, vMean = 4.995653. ' +
            'Larger end by Dh: rect 2*0.2*0.15/0.35 = 0.171429 > round 0.15, so d = 0.171429. Re = vMean * d / 1.5146e-5; friction = lambda * 0.25 / d * Pd; local = 0.1 * Pd.',
    },
];
