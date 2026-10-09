import { z } from 'zod';
import { defaultConfig, type CalcConfig } from '../calc/config';
import type { DuctSection, Fitting, SheetListItem } from '../calc/types';
import type { ErrorCode } from './codes';

/** Boundary units: mm, degrees, m3/h, C, Pa. Zod `error` params carry stable codes, not text. */

// Missing, wrong type or non-finite number -> one code each; a code per rule is attached by the callers.
const typeError =
  (finiteCode: ErrorCode) =>
  (iss: { input?: unknown }): ErrorCode =>
    iss.input === undefined ? 'field.required' : typeof iss.input === 'number' ? finiteCode : 'field.invalid';

const size = () => z.number({ error: typeError('size.notFinite') }).gt(0, { error: 'size.nonPositive', abort: true });

const allowance = () => z.number({ error: typeError('field.invalid') }).gte(0, { error: 'allowance.negative' });

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
      obj({
        kind: z.literal('roundElbow'),
        diameter: size(),
        centerRadius: size(),
        angle,
        allowance: allowance(),
      }),
      obj({
        kind: z.literal('rectElbow'),
        width: size(),
        height: size(),
        innerRadius: size(),
        angle,
        allowance: allowance(),
      }),
      obj({
        kind: z.literal('roundReducer'),
        diameter: size(),
        smallDiameter: size(),
        length: reducerLength,
        allowance: allowance(),
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

  return { fitting, ductSection, airInput, sheetListItem, sheetList };
}

export const {
  fitting: fittingSchema,
  ductSection: ductSectionSchema,
  airInput: airInputSchema,
  sheetListItem: sheetListItemSchema,
  sheetList: sheetListSchema,
} = createSchemas(defaultConfig);

export type AirInput = z.infer<typeof airInputSchema>;

// Compile-time guard: parsed output must match the types in calc/types.ts (which stay the single source).
type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _fittingMatches: Mutual<z.infer<typeof fittingSchema>, Fitting> = true;
const _sectionMatches: Mutual<z.infer<typeof ductSectionSchema>, DuctSection> = true;
const _itemMatches: Mutual<z.infer<typeof sheetListItemSchema>, SheetListItem> = true;
void _fittingMatches;
void _itemMatches;
void _sectionMatches;
