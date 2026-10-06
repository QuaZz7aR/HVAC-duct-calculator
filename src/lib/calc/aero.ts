import type { AirConditions, DuctSection, PressureDrop } from './types';

export const pressureDrop: (section: DuctSection, air: AirConditions) => PressureDrop = () => {
  throw new Error('not implemented: pressureDrop');
};
