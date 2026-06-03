import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES } from './preferences';
import { resolveEffectivePreferences } from './resolve-effective-preferences';

describe('resolveEffectivePreferences', () => {
  it('maps system theme to dark when OS prefers dark', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, theme: 'system' },
      { prefersDark: true, prefersMoreContrast: false },
    );

    expect(result.theme).toBe('dark');
  });

  it('maps system theme to light when OS prefers light', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, theme: 'system' },
      { prefersDark: false, prefersMoreContrast: false },
    );

    expect(result.theme).toBe('light');
  });

  it('keeps manual warm theme regardless of OS', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, theme: 'warm' },
      { prefersDark: true, prefersMoreContrast: true },
    );

    expect(result.theme).toBe('warm');
  });

  it('enables high contrast when mode is on', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, highContrast: 'on' },
      { prefersDark: false, prefersMoreContrast: false },
    );

    expect(result.highContrast).toBe(true);
  });

  it('disables high contrast when mode is off', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, highContrast: 'off' },
      { prefersDark: false, prefersMoreContrast: true },
    );

    expect(result.highContrast).toBe(false);
  });

  it('follows OS contrast when mode is system', () => {
    const on = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, highContrast: 'system' },
      { prefersDark: false, prefersMoreContrast: true },
    );
    const off = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, highContrast: 'system' },
      { prefersDark: false, prefersMoreContrast: false },
    );

    expect(on.highContrast).toBe(true);
    expect(off.highContrast).toBe(false);
  });

  it('resolves theme and contrast independently', () => {
    const result = resolveEffectivePreferences(
      { ...DEFAULT_PREFERENCES, theme: 'dark', highContrast: 'system' },
      { prefersDark: false, prefersMoreContrast: true },
    );

    expect(result.theme).toBe('dark');
    expect(result.highContrast).toBe(true);
  });
});
