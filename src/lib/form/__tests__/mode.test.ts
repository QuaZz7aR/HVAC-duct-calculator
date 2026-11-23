import { describe, expect, it } from 'vitest';
import { defaultMode, toMode } from '../mode';

describe('toMode', () => {
  it('keeps a known mode', () => {
    expect(toMode('simple')).toBe('simple');
    expect(toMode('advanced')).toBe('advanced');
  });
  it('falls back to the default for anything else', () => {
    expect(toMode(null)).toBe(defaultMode);
    expect(toMode('expert')).toBe(defaultMode);
  });
});
