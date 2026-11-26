import { describe, expect, it } from 'vitest';
import { themeScript, toAccent } from '../theme';

describe('accent', () => {
  it('reads a stored value, unknown is blue', () => {
    expect(toAccent('red')).toBe('red');
    expect(toAccent('blue')).toBe('blue');
    expect(toAccent('green')).toBe('blue');
    expect(toAccent(null)).toBe('blue');
  });
  it('the pre-paint script sets the red accent', () => {
    expect(themeScript).toContain("dataset.accent='red'");
  });
});
