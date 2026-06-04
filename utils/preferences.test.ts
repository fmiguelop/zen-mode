import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, normalizeStillPreferences } from './preferences';

describe('normalizeStillPreferences', () => {
  it('defaults fontFamily to inter when missing', () => {
    const result = normalizeStillPreferences({
      theme: 'warm',
      fontSize: 'large',
    });

    expect(result.fontFamily).toBe('inter');
  });

  it('preserves valid fontFamily values', () => {
    expect(normalizeStillPreferences({ fontFamily: 'atkinson' }).fontFamily).toBe('atkinson');
    expect(normalizeStillPreferences({ fontFamily: 'system' }).fontFamily).toBe('system');
  });

  it('falls back to inter for invalid fontFamily', () => {
    const result = normalizeStillPreferences({ fontFamily: 'comic-sans' });

    expect(result.fontFamily).toBe(DEFAULT_PREFERENCES.fontFamily);
  });

  it('defaults theme and fontFamily when storage object is empty', () => {
    const result = normalizeStillPreferences({});

    expect(result.theme).toBe(DEFAULT_PREFERENCES.theme);
    expect(result.fontFamily).toBe(DEFAULT_PREFERENCES.fontFamily);
  });

  it('defaults enterFullscreenOnOpen to false when missing', () => {
    expect(normalizeStillPreferences({}).enterFullscreenOnOpen).toBe(false);
  });

  it('preserves enterFullscreenOnOpen when valid', () => {
    expect(normalizeStillPreferences({ enterFullscreenOnOpen: true }).enterFullscreenOnOpen).toBe(
      true,
    );
  });
});
