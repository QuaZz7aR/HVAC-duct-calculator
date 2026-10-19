import type { WarningCode } from '../calc/warnings';
import type { FittingKind } from '../form/fields';
import type { FormIssueCode } from '../form/messages';

/**
 * Every user-visible string lives here. Another language is one more file with the same shape.
 * Fitting designations follow the engineer's Excel (КВ, ПВ, КО, ПО, КП, ПП, ППК, Заглушка).
 */
export const uk = {
  appTitle: 'Калькулятор повітроводів',
  appSubtitle:
    'Список фасонних частин → площа металу, товщина, довжина по осі та втрати тиску. Усе рахується в браузері.',
  airTitle: 'Параметри повітря',
  airTemperature: 'Температура, °C',
  airPressure: 'Тиск, Па',
  settings: {
    title: 'Параметри розрахунку',
    thicknessTable: 'Таблиця товщин металу',
    thicknessDbn: 'ДБН В.2.5-67:2013, дод. Ц',
    thicknessEngineer: 'Інженера: 0,55 / 0,7 мм',
    seamPercent: 'Запас на фальц, % (крім відводів)',
    marginPercent: 'Запас на замовлення, %',
    sheet: 'Розмір листа, мм',
    note: 'Запас на фальц додається до площі всіх деталей, крім відводів (вони мають власні коефіцієнти розкрою). Запас на замовлення не змінює розрахункову площу: він лише збільшує «до замовлення» і кількість листів.',
  },
  itemsTitle: 'Деталі',
  addItem: 'Додати деталь',
  removeItem: 'Видалити',
  kind: 'Тип',
  quantity: 'Кількість, шт',
  flow: 'Витрата, м³/год',
  zeta: 'ζ (місцевий опір)',
  optional: 'необов’язково',
  kinds: {
    roundStraight: { designation: 'КВ', name: 'Круглий повітровод' },
    rectStraight: { designation: 'ПВ', name: 'Прямокутний повітровод' },
    roundCap: { designation: 'Заглушка', name: 'Заглушка кругла' },
    rectCap: { designation: 'Заглушка', name: 'Заглушка прямокутна' },
    roundElbow: { designation: 'КО', name: 'Круглий відвід' },
    rectElbow: { designation: 'ПО', name: 'Прямокутний відвід' },
    roundReducer: { designation: 'КП', name: 'Круглий перехід' },
    rectReducer: { designation: 'ПП', name: 'Прямокутний перехід' },
    rectToRoundReducer: { designation: 'ППК', name: 'Перехід прямокутник → круг' },
    roundTee: { designation: 'КТ', name: 'Круглий трійник' },
    roundTeeRectBranch: { designation: 'КПТ', name: 'Круглий трійник із прямокутною врізкою' },
    rectTee: { designation: 'ПТ', name: 'Прямокутний трійник' },
    rectTeeRoundBranch: { designation: 'ПКТ', name: 'Прямокутний трійник із круглою врізкою' },
    roundCross: { designation: 'КККр', name: 'Кругла хрестовина із круглими врізками' },
    roundCrossRectBranches: { designation: 'КПКр', name: 'Кругла хрестовина із прямокутними врізками' },
    rectCross: { designation: 'ППКр', name: 'Прямокутна хрестовина із прямокутними врізками' },
    rectCrossRoundBranches: { designation: 'ПККр', name: 'Прямокутна хрестовина із круглими врізками' },
  } satisfies Record<FittingKind, { designation: string; name: string }>,
  fields: {
    diameter: 'Діаметр Д, мм',
    smallDiameter: 'Малий діаметр, мм',
    width: 'Ширина, мм',
    height: 'Висота, мм',
    smallWidth: 'Мала ширина, мм',
    smallHeight: 'Мала висота, мм',
    length: 'Довжина, мм',
    centerRadius: 'Радіус по осі, мм',
    innerRadius: 'Внутрішній радіус, мм',
    angle: 'Кут, °',
    allowance: 'Припуск, мм',
    branchDiameter: 'Діаметр врізки, мм',
    branchWidth: 'Ширина врізки (вздовж осі), мм',
    branchHeight: 'Висота врізки, мм',
  },
  results: {
    title: 'Результати по позиціях',
    item: 'Деталь',
    thickness: 'Товщина металу, мм',
    metalArea: 'Площа, м² (шт.)',
    metalAreaTotal: 'Сума площі, м²',
    centerline: 'Довжина по осі, м',
    velocity: 'Швидкість, м/с',
    friction: 'Падіння тиску на тертя, Па',
    local: 'Місцеве падіння тиску, Па',
    pressureDrop: 'Загальне падіння тиску, Па (шт.)',
    empty: 'Додайте деталь, щоб побачити розрахунок.',
    skipped: (n: number) => `Не враховано позицій з помилками: ${n}.`,
  },
  totals: {
    title: 'Разом',
    metalArea: 'Площа металу, м²',
    metalAreaToOrder: 'Площа до замовлення (із запасом), м²',
    pressureDrop: 'Сума втрат тиску, Па',
    pressureDropNote: 'Сума по всіх позиціях з урахуванням кількості, як для однієї послідовної ділянки.',
  },
  sheetList: {
    title: 'Відомість металу за товщиною',
    thickness: 'Товщина, мм',
    area: 'Площа, м²',
    orderArea: 'До замовлення, м²',
    sheets: 'Листів, шт',
    note: 'Площа з коефіцієнтом розкрою. Листів = округлення вгору (площа до замовлення / площа листа) окремо для кожної товщини.',
  },
  errors: {
    'field.required': 'Обов’язкове поле',
    'field.invalid': 'Некоректне значення',
    'size.nonPositive': 'Має бути більше нуля',
    'size.notFinite': 'Введіть число',
    'allowance.negative': 'Не може бути від’ємним',
    'angle.outOfRange': 'Кут має бути більшим за 0° і не більшим за 180°',
    'reducer.tooShort': 'Довжина переходу менша за мінімально допустиму',
    'reducer.noSizeChange': 'Розміри кінців переходу однакові',
    'flow.nonPositive': 'Витрата має бути більшою за нуль',
    'coefficient.negative': 'Не може бути від’ємним',
    'roughness.negative': 'Шорсткість не може бути від’ємною',
    'air.temperatureTooLow': 'Температура нижче абсолютного нуля',
    'air.pressureNonPositive': 'Тиск має бути більшим за нуль',
    'kind.unknown': 'Невідомий тип деталі',
    'input.unknownKey': 'Зайве поле',
    'input.invalid': 'Некоректні дані',
    'quantity.invalid': 'Ціле число, не менше 1',
  } satisfies Record<FormIssueCode, string>,
  // non-blocking advice next to a row; numbers come from the warning, thresholds from config
  warnings: {
    title: 'Попередження',
    'aspect.high': (value: string, limit: string) =>
      `Співвідношення сторін ${value} (від ${limit}): на практиці так не роблять, перевірте розміри та товщину металу.`,
    'aspect.excessive': (value: string, limit: string) =>
      `Співвідношення сторін ${value} перевищує ${limit} (ДБН В.2.5-67:2013, додаток Ц). Розміри краще змінити.`,
    'size.overLimit': (value: string, limit: string) =>
      `Розмір ${value} мм більший за ${limit} мм: товщину металу потрібно обґрунтувати розрахунком (ДБН В.2.5-67:2013, додаток Ц).`,
    'elbow.radiusLarge': (value: string, limit: string) =>
      `Внутрішній радіус ${value} мм завеликий (більше ${limit} мм): деталь може вийти некоректною, перевірте радіус.`,
    'branch.larger': (value: string) =>
      `Переріз врізки більший за переріз магістралі (у ${value} раза): перевірте розміри, площа може вийти некоректною.`,
  } satisfies Record<'title' | WarningCode, string | ((value: string, limit: string) => string)>,
  footer: 'Розрахунок за методикою, звіреною з Excel практикуючого інженера. Коефіцієнти розкрою попередні; товщини за ДБН В.2.5-67:2013 (довідково).',
};

export type Dictionary = typeof uk;
