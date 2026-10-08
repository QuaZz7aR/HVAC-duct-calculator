// Waste factor for elbows only (Excel КО/ПО). TODO(confirm): engineer copied these from websites as a safety margin.
// round elbow: D < 315 -> 1.15, else 1.1; rect elbow: equivalent diameter 2WH/(W+H) < 250 -> 1.2, else 1.1; other kinds: 1.0
// metalArea = sheetArea (see sheet-area.fixtures.ts, same id) * factor
export const metalAreaCases = [
    { id: 'round-elbow-d250-r250-90', input: { kind: 'roundElbow', diameter: 250, centerRadius: 250, angle: 90, allowance: 50 }, factor: 1.15, metalArea: 0.445009697 },
    { id: 'round-elbow-d400-r400-45', input: { kind: 'roundElbow', diameter: 400, centerRadius: 400, angle: 45, allowance: 50 }, factor: 1.1, metalArea: 0.572492670 },
    { id: 'rect-elbow-350x150-r125-90', input: { kind: 'rectElbow', width: 350, height: 150, innerRadius: 125, angle: 90, allowance: 50 }, factor: 1.2, metalArea: 0.685486678 }, // Dh = 210
    { id: 'rect-elbow-400x200-r200-45', input: { kind: 'rectElbow', width: 400, height: 200, innerRadius: 200, angle: 45, allowance: 50 }, factor: 1.1, metalArea: 0.546690230 }, // Dh = 266.7
    { id: 'round-straight-d150-1m', input: { kind: 'roundStraight', diameter: 150, length: 1000 }, factor: 1.0, metalArea: 0.471238898 },
] as const;