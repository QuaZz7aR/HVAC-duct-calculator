import type { CalcConfig } from './config';
import type { AirConditions } from './types';

/** Density and kinematic viscosity of dry air; inputs in C and Pa, outputs SI. */
export function airAtConditions(temperatureC: number, pressurePa: number, config: CalcConfig): AirConditions {
  if (!Number.isFinite(temperatureC) || !Number.isFinite(pressurePa)) {
    throw new Error(`invalid air conditions: ${temperatureC} C, ${pressurePa} Pa`);
  }
  if (pressurePa <= 0) {
    throw new Error(`air pressure must be positive: ${pressurePa} Pa`);
  }
  const { gasConstantJPerKgK: r, zeroCelsiusK: t0, sutherlandMu0KgfSPerM2: mu0, sutherlandCK: c, gravityMPerS2: g } = config.air;
  const tK = temperatureC + t0;
  if (tK <= 0) {
    throw new Error(`air temperature below absolute zero: ${temperatureC} C`);
  }

  // ideal gas: rho = P / (R * T)
  const density = pressurePa / (r * tK);
  // Sutherland dynamic viscosity referenced to 0 C, kgf*s/m2 converted to Pa*s by g
  const mu = mu0 * ((1 + c / t0) / (1 + c / tK)) * Math.sqrt(tK / t0) * g;
  // kinematic viscosity: nu = mu / rho
  return { density, kinematicViscosity: mu / density };
}
