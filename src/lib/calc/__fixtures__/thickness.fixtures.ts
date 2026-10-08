// Placeholder thresholds: round < 400 mm -> 0.55, else 0.7 (from Excel, unconfirmed).
// Rect uses the LARGER side with the same threshold (CLAUDE.md), unlike Excel which used equivalent diameter.
export const thicknessCases = [
    { id: 'round-d399', shape: 'round', diameter: 399, thickness: 0.55 },
    { id: 'round-d400', shape: 'round', diameter: 400, thickness: 0.7 },
    { id: 'rect-300x200', shape: 'rect', width: 300, height: 200, thickness: 0.55 },
    { id: 'rect-400x300-larger-side', shape: 'rect', width: 400, height: 300, thickness: 0.7 }, // Excel gave 0.55
    { id: 'rect-300x400-larger-side', shape: 'rect', width: 300, height: 400, thickness: 0.7 },
] as const;