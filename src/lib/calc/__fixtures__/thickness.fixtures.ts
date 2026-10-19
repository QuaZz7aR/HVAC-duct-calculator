// Default table: ДБН В.2.5-67:2013, додаток Ц (dbnThickness in config.ts), "up to N inclusive"; sizes between listed ones take the next larger listed size.
// round by diameter: <= 200 -> 0.5; <= 450 -> 0.6; <= 800 -> 0.7; <= 1250 -> 1.0; <= 1600 -> 1.2; <= 2000 -> 1.4.
// rect by the LARGER side: <= 250 -> 0.5; <= 1000 -> 0.7; <= 2000 -> 0.9. Above 2000 the last band is used and the size warning fires.
// The engineer's table (0.55 below 400, else 0.7) is an option and is tested in thickness-tables.test.ts.
export const thicknessCases = [
    { id: 'round-d200', shape: 'round', diameter: 200, thickness: 0.5 },
    { id: 'round-d201', shape: 'round', diameter: 201, thickness: 0.6 },
    { id: 'round-d399', shape: 'round', diameter: 399, thickness: 0.6 },
    { id: 'round-d400', shape: 'round', diameter: 400, thickness: 0.6 },
    { id: 'round-d450', shape: 'round', diameter: 450, thickness: 0.6 },
    { id: 'round-d451', shape: 'round', diameter: 451, thickness: 0.7 },
    { id: 'round-d800', shape: 'round', diameter: 800, thickness: 0.7 },
    { id: 'round-d801', shape: 'round', diameter: 801, thickness: 1.0 },
    { id: 'round-d1250', shape: 'round', diameter: 1250, thickness: 1.0 },
    { id: 'round-d1251', shape: 'round', diameter: 1251, thickness: 1.2 },
    { id: 'round-d1600', shape: 'round', diameter: 1600, thickness: 1.2 },
    { id: 'round-d1601', shape: 'round', diameter: 1601, thickness: 1.4 },
    { id: 'round-d2000', shape: 'round', diameter: 2000, thickness: 1.4 },
    { id: 'rect-250x100', shape: 'rect', width: 250, height: 100, thickness: 0.5 },
    { id: 'rect-300x200', shape: 'rect', width: 300, height: 200, thickness: 0.7 },
    { id: 'rect-400x300-larger-side', shape: 'rect', width: 400, height: 300, thickness: 0.7 },
    { id: 'rect-300x400-larger-side', shape: 'rect', width: 300, height: 400, thickness: 0.7 },
    { id: 'rect-1000x200', shape: 'rect', width: 1000, height: 200, thickness: 0.7 },
    { id: 'rect-200x1001', shape: 'rect', width: 200, height: 1001, thickness: 0.9 },
    { id: 'rect-2000x500', shape: 'rect', width: 2000, height: 500, thickness: 0.9 },
] as const;
