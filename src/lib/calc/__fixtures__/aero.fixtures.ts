/**
 * Reference values for the aerodynamic part. Taken from the original Excel (practising engineer's calculator).
 *
 * Model: Altshul friction factor  lambda = 0.11 * (k/d + 68/Re)^0.25,  d = 2ab/(a+b) for rectangles,
 * friction loss = lambda * L/d * Pd,  local loss = zeta * Pd,  Pd = rho * v^2 / 2.
 *
 * Tolerance: relative 2e-3, NOT tighter. Excel computes the velocity of ROUND ducts with pi = 3.14,
 * which inflates Pd by ~0.1 %. Do not "fix" the implementation to reproduce that artefact.
 * `velocity` is rounded to 2 decimals in the source: compare with an absolute tolerance of 0.01.
 */
import type { AirConditions, DuctSection, PressureDrop } from '../types';

export const air: AirConditions = { density: 1.1965747, kinematicViscosity: 1.5146e-5 };

export const AERO_REL_TOLERANCE = 2e-3;
export const VELOCITY_ABS_TOLERANCE = 0.01;

export interface AeroCase {
  id: string;
  excelCode: string;
  section: DuctSection;
  expected: PressureDrop;
  basis: 'geometry' | 'excel';
  note?: string;
}

export const aeroCases: AeroCase[] = [
  {
    id: 'round-d355',
    excelCode: 'КВ',
    section: { shape: 'round', diameter: 355, flow: 1500, length: 1000, localCoefficient: 0.218, roughness: 0.1 },
    expected: { velocity: 4.21, reynolds: 98713.95289, dynamicPressure: 10.61291349, frictionFactor: 0.019415433, frictionLoss: 0.580434669, localLoss: 2.31362 },
    basis: 'geometry',
  },
  {
    id: 'round-d150',
    excelCode: 'КВ',
    section: { shape: 'round', diameter: 150, flow: 265, length: 1000, localCoefficient: 0.218, roughness: 0.1 },
    expected: { velocity: 4.17, reynolds: 41273.40052, dynamicPressure: 10.3918347, frictionFactor: 0.024126465, frictionLoss: 1.67145493, localLoss: 2.26542 },
    basis: 'geometry',
  },
  {
    id: 'flexible-d200',
    excelCode: 'ГВ',
    section: { shape: 'round', diameter: 200, flow: 350, length: 1000, localCoefficient: 0.25, roughness: 0.1 },
    expected: { velocity: 3.1, reynolds: 40884.02882, dynamicPressure: 5.73563656, frictionFactor: 0.023722962, frictionLoss: 0.680331452, localLoss: 1.43391 },
    basis: 'excel',
    note: 'flexible duct uses steel roughness 0.1 mm - author confirmed this is a simplification',
  },
  {
    id: 'rect-300x300',
    excelCode: 'ПВ',
    section: { shape: 'rect', width: 300, height: 300, flow: 540, length: 8000, localCoefficient: 0.0178, roughness: 0.1 },
    expected: { velocity: 1.67, reynolds: 33010.93298, dynamicPressure: 1.661909355, frictionFactor: 0.024329883, frictionLoss: 1.078241595, localLoss: 0.02958 },
    basis: 'geometry',
  },
  {
    id: 'rect-350x150',
    excelCode: 'ПТ',
    section: { shape: 'rect', width: 350, height: 150, flow: 800, length: 450, localCoefficient: 0.45, roughness: 0.1 },
    expected: { velocity: 4.23, reynolds: 58686.10308, dynamicPressure: 10.7192944, frictionFactor: 0.022118991, frictionLoss: 0.508071385, localLoss: 4.82368 },
    basis: 'geometry',
  },
  {
    id: 'round-d150-tee',
    excelCode: 'КТ',
    section: { shape: 'round', diameter: 150, flow: 300, length: 250, localCoefficient: 0.4, roughness: 0.1 },
    expected: { velocity: 4.72, reynolds: 46724.60437, dynamicPressure: 13.31812208, frictionFactor: 0.023609086, frictionLoss: 0.524047808, localLoss: 5.32725 },
    basis: 'geometry',
  },
];
