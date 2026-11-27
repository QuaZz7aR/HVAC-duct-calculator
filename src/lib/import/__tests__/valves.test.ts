import { describe, expect, it } from 'vitest';
import { parseName, recognizeKind } from '../recognize';

const kindOf = (name: string, code?: string) => recognizeKind(code, name, parseName(name).sizes);

// ADR 0120: dampers and check valves are recognised; other valves (fire, air) stay not ours
describe('import of dampers and check valves', () => {
  it('reads the words in Ukrainian, Russian and English', () => {
    expect(kindOf('Дроссель-клапан Д250')).toBe('roundDamper');
    expect(kindOf('Дросель-клапан 400х200')).toBe('rectDamper');
    expect(kindOf('Клапан обратный Д160')).toBe('roundCheckValve');
    expect(kindOf('Зворотний клапан 500х300')).toBe('rectCheckValve');
    expect(kindOf('Обратный клапан 600x300')).toBe('rectCheckValve');
    expect(kindOf('Check valve 400x200')).toBe('rectCheckValve');
  });

  it('reads the codes of this site', () => {
    expect(kindOf('', 'КДК')).toBe('roundDamper');
    expect(kindOf('', 'ПЗК')).toBe('rectCheckValve');
    expect(kindOf('', 'RDM')).toBe('rectDamper');
  });

  it('leaves other valves alone', () => {
    expect(kindOf('Клапан огнезадерживающий 400х200')).toBeUndefined();
    expect(kindOf('Клапан воздушный Д250')).toBeUndefined();
  });
});
