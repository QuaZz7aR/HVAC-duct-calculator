import { describe, expect, it } from 'vitest';
import { resolveTheme, toTheme } from '../theme';

describe('theme', () => {
  it('reads a stored value, unknown is system', () => {
    expect(toTheme('dark')).toBe('dark');
    expect(toTheme('light')).toBe('light');
    expect(toTheme('blue')).toBe('system');
    expect(toTheme(null)).toBe('system');
  });
  it('system follows the device, a pick overrides it', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
