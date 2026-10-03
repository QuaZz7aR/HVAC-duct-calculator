/**
 * PENDING - DO NOT IMPLEMENT YET.
 *
 * Both values are correct arithmetic; what is undecided is the convention.
 * The original Excel subtracts the branch opening from the main duct ONLY for the rect-to-rect tee (ПТ),
 * where it matches `areaWithOpeningSubtracted`. Every other row in Excel matches `areaWithoutOpening`.
 * Physically the cut-out should be subtracted everywhere.
 * Waiting for the decision of the spreadsheet author. Main body length is derived:
 * branch size along the main axis + 2 x allowance.
 */
export const pendingTeesAndCrosses = [
  {
    id: 'round-tee-d150-branch-d150',
    excelCode: 'КТ',
    description: 'round main D150, round branch d150, allowance 50',
    areaWithoutOpening: 0.141371669,
    openingArea: 0.017671459,
    areaWithOpeningSubtracted: 0.123700211,
  },
  {
    id: 'round-tee-d200-branch-300x100',
    excelCode: 'КПТ',
    description: 'round main D200, rect branch 300x100, allowance 50',
    areaWithoutOpening: 0.291327412,
    openingArea: 0.03,
    areaWithOpeningSubtracted: 0.261327412,
  },
  {
    id: 'rect-tee-350x150-branch-350x150',
    excelCode: 'ПТ',
    description: 'rect main 350x150, rect branch 350x150, allowance 50',
    areaWithoutOpening: 0.5,
    openingArea: 0.0525,
    areaWithOpeningSubtracted: 0.4475,
  },
  {
    id: 'rect-tee-350x150-branch-d150',
    excelCode: 'ПКТ',
    description: 'rect main 350x150, round branch d150, allowance 50',
    areaWithoutOpening: 0.273561945,
    openingArea: 0.017671459,
    areaWithOpeningSubtracted: 0.255890486,
  },
  {
    id: 'round-cross-d315-branches-d200',
    excelCode: 'КККр',
    description: 'round main D315, two round branches d200, allowance 50',
    areaWithoutOpening: 0.359712359,
    openingArea: 0.062831853,
    areaWithOpeningSubtracted: 0.296880506,
  },
  {
    id: 'round-cross-d315-branches-300x200',
    excelCode: 'КПКр',
    description: 'round main D315, two rect branches 300x200, allowance 50',
    areaWithoutOpening: 0.495840674,
    openingArea: 0.12,
    areaWithOpeningSubtracted: 0.375840674,
  },
] as const;
