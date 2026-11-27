import { z } from 'zod';
import { defaultConfig, type CalcConfig } from '../calc/config';
import type { DuctSection, Fitting, SheetListItem } from '../calc/types';
import type { Equipment } from '../calc/equipment';
import type { ErrorCode } from './codes';

/** Boundary units: mm, degrees, m3/h, C, Pa. Zod `error` params carry stable codes, not text. */

// Missing, wrong type or non-finite number -> one code each; a code per rule is attached by the callers.
const typeError =
  (finiteCode: ErrorCode) =>
  (iss: { input?: unknown }): ErrorCode =>
    iss.input === undefined ? 'field.required' : typeof iss.input === 'number' ? finiteCode : 'field.invalid';

const size = () => z.number({ error: typeError('size.notFinite') }).gt(0, { error: 'size.nonPositive', abort: true });

const allowance = () => z.number({ error: typeError('field.invalid') }).gte(0, { error: 'allowance.negative' });

// How many connection ends get the allowance (ADR 0041); absent = 2.
const allowanceCount = () =>
  z.union([z.literal(0), z.literal(1), z.literal(2)], { error: 'allowanceCount.invalid' }).optional();

// Saddle of the branches on a round main (ADR 0118); absent = off.
const saddle = () => z.union([z.literal(0), z.literal(1)], { error: 'saddle.invalid' }).optional();

export function createSchemas(config: CalcConfig) {
  const angle = z
    .number({ error: typeError('field.invalid') })
    .gt(0, { error: 'angle.outOfRange', abort: true })
    .lte(180, { error: 'angle.outOfRange' });

  // Reducer length is optional (default from config) but a typed value below the floor is an error, never clamped.
  const reducerLength = z
    .number({ error: typeError('size.notFinite') })
    .gt(0, { error: 'size.nonPositive', abort: true })
    .gte(config.reducerMinLengthMm, { error: 'reducer.tooShort' })
    .default(config.reducerLengthMm);

  const obj = <T extends z.ZodRawShape>(shape: T) => z.strictObject(shape);

  const fitting = z.discriminatedUnion(
    'kind',
    [
      obj({ kind: z.literal('roundStraight'), diameter: size(), length: size() }),
      obj({ kind: z.literal('rectStraight'), width: size(), height: size(), length: size() }),
      obj({ kind: z.literal('roundCap'), diameter: size(), length: size() }),
      obj({ kind: z.literal('rectCap'), width: size(), height: size(), length: size() }),
      obj({ kind: z.literal('roundTap'), diameter: size(), length: size(), mainDiameter: size().optional() }),
      obj({ kind: z.literal('rectTap'), width: size(), height: size(), length: size(), mainDiameter: size().optional() }),
      // BETA, ADR 0113: adapter / box and offsets
      obj({
        kind: z.literal('rectBox'),
        width: size(),
        height: size(),
        length: size(),
        ends: z.union([z.literal(0), z.literal(1), z.literal(2)], { error: 'box.ends' }),
        partitions: z.number({ error: typeError('field.invalid') }).int({ error: 'box.partitions' }).gte(0, { error: 'box.partitions' }).default(0),
        openFaces: z.union([z.literal(0), z.literal(1)], { error: 'box.openFaces' }).optional(),
      }),
      obj({
        kind: z.literal('roundOffset'),
        diameter: size(),
        length: size(),
        offset: z.number({ error: typeError('field.invalid') }).gte(0, { error: 'offset.negative' }),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('rectOffset'),
        width: size(),
        height: size(),
        length: size(),
        offset: z.number({ error: typeError('field.invalid') }).gte(0, { error: 'offset.negative' }),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('roundElbow'),
        diameter: size(),
        centerRadius: size(),
        angle,
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('rectElbow'),
        width: size(),
        height: size(),
        innerRadius: size(),
        angle,
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('roundReducer'),
        diameter: size(),
        smallDiameter: size(),
        length: reducerLength,
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }).check((ctx) => {
        if (ctx.value.diameter === ctx.value.smallDiameter) {
          ctx.issues.push({ code: 'custom', message: 'reducer.noSizeChange', path: ['smallDiameter'], input: ctx.value });
        }
      }),
      obj({
        kind: z.literal('rectReducer'),
        width: size(),
        height: size(),
        smallWidth: size(),
        smallHeight: size(),
        length: reducerLength,
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }).check((ctx) => {
        const v = ctx.value;
        if (v.width === v.smallWidth && v.height === v.smallHeight) {
          ctx.issues.push({ code: 'custom', message: 'reducer.noSizeChange', path: ['smallWidth'], input: v });
        }
      }),
      // A shape change by itself, so there is no "same size" rule.
      obj({
        kind: z.literal('rectToRoundReducer'),
        width: size(),
        height: size(),
        smallDiameter: size(),
        length: reducerLength,
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      // Tees and crosses: main run + branch size along the axis; allowance is also the collar length.
      obj({ kind: z.literal('roundTee'), diameter: size(), branchDiameter: size(), allowance: allowance(), allowanceCount: allowanceCount(), saddle: saddle() }),
      obj({
        kind: z.literal('roundTeeRectBranch'),
        diameter: size(),
        branchWidth: size(),
        branchHeight: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
        saddle: saddle(),
      }),
      obj({
        kind: z.literal('rectTee'),
        width: size(),
        height: size(),
        branchWidth: size(),
        branchHeight: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('rectTeeRoundBranch'),
        width: size(),
        height: size(),
        branchDiameter: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({ kind: z.literal('roundCross'), diameter: size(), branchDiameter: size(), allowance: allowance(), allowanceCount: allowanceCount(), saddle: saddle() }),
      obj({
        kind: z.literal('roundCrossRectBranches'),
        diameter: size(),
        branchWidth: size(),
        branchHeight: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
        saddle: saddle(),
      }),
      obj({
        kind: z.literal('rectCross'),
        width: size(),
        height: size(),
        branchWidth: size(),
        branchHeight: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
      obj({
        kind: z.literal('rectCrossRoundBranches'),
        width: size(),
        height: size(),
        branchDiameter: size(),
        allowance: allowance(),
        allowanceCount: allowanceCount(),
      }),
    ],
    { error: 'kind.unknown' },
  );

  const sectionBase = {
    flow: z.number({ error: typeError('field.invalid') }).gt(0, { error: 'flow.nonPositive' }),
    length: size(),
    localCoefficient: z.number({ error: typeError('field.invalid') }).gte(0, { error: 'coefficient.negative' }),
    roughness: z.number({ error: typeError('field.invalid') }).gte(0, { error: 'roughness.negative' }),
  };

  const ductSection = z.discriminatedUnion(
    'shape',
    [
      obj({ shape: z.literal('round'), diameter: size(), ...sectionBase }),
      obj({ shape: z.literal('rect'), width: size(), height: size(), ...sectionBase }),
    ],
    { error: 'kind.unknown' },
  );

  const airInput = obj({
    temperatureC: z
      .number({ error: typeError('field.invalid') })
      .gt(-config.air.zeroCelsiusK, { error: 'air.temperatureTooLow' }),
    pressurePa: z.number({ error: typeError('field.invalid') }).gt(0, { error: 'air.pressureNonPositive' }),
  });

  // Pieces of one fitting: a positive integer. Checked in order so one bad value gives one issue.
  const quantity = z
    .number({ error: typeError('quantity.invalid') })
    .gte(1, { error: 'quantity.invalid', abort: true })
    .int({ error: 'quantity.invalid' });

  const sheetListItem = obj({ fitting, quantity });
  const sheetList = z.array(sheetListItem, { error: 'field.invalid' });

  // equipment (ADR 0120): casing sizes and the duct openings on it; insulation only
  const opening = z.discriminatedUnion(
    'shape',
    [obj({ shape: z.literal('round'), diameter: size() }), obj({ shape: z.literal('rect'), width: size(), height: size() })],
    { error: 'field.invalid' },
  );
  const equipment = obj({ length: size(), width: size(), height: size(), openings: z.array(opening, { error: 'field.invalid' }) });
  const equipmentItem = obj({ equipment, quantity });

  return { fitting, ductSection, airInput, sheetListItem, sheetList, equipmentItem };
}

export const {
  fitting: fittingSchema,
  ductSection: ductSectionSchema,
  airInput: airInputSchema,
  sheetListItem: sheetListItemSchema,
  sheetList: sheetListSchema,
  equipmentItem: equipmentItemSchema,
} = createSchemas(defaultConfig);

export type AirInput = z.infer<typeof airInputSchema>;

// Compile-time guard: parsed output must match the types in calc/types.ts (which stay the single source).
type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _fittingMatches: Mutual<z.infer<typeof fittingSchema>, Fitting> = true;
const _sectionMatches: Mutual<z.infer<typeof ductSectionSchema>, DuctSection> = true;
const _itemMatches: Mutual<z.infer<typeof sheetListItemSchema>, SheetListItem> = true;
const _equipmentMatches: Mutual<z.infer<typeof equipmentItemSchema>['equipment'], Equipment> = true;
void _equipmentMatches;
void _fittingMatches;
void _itemMatches;
void _sectionMatches;
