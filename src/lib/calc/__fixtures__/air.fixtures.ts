// Air properties from temperature and pressure (Excel "Шаблон" AP5, AQ5).
// rho = P / (R * (T + T0)); mu by Sutherland (mu0 = 1.74e-6 kgf*s/m2 at 0 C, C = 114 K) * g; nu = mu / rho.
// Constants as in Excel: R = 287, T0 = 273, g = 9.8. The 22 C case equals the air used in aero.fixtures.ts.
export const airCases = [
    { id: 'excel-22c-101308', temperatureC: 22, pressurePa: 101308, density: 1.19657474, kinematicViscosity: 1.51464971e-5 },
    { id: 'std-20c', temperatureC: 20, pressurePa: 101325, density: 1.20494464, kinematicViscosity: 1.49617449e-5 },
    { id: 'std-0c', temperatureC: 0, pressurePa: 101325, density: 1.29321898, kinematicViscosity: 1.31857020e-5 },
    { id: 'std-40c', temperatureC: 40, pressurePa: 101325, density: 1.12795138, kinematicViscosity: 1.68205647e-5 },
] as const;