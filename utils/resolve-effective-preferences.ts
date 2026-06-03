import type { EffectiveTheme, HighContrastMode, StillPreferences } from './preferences';

export interface EffectivePreferences {
  theme: EffectiveTheme;
  highContrast: boolean;
}

export interface SystemMediaSnapshot {
  prefersDark: boolean;
  prefersMoreContrast: boolean;
}

export function readSystemMedia(): SystemMediaSnapshot {
  return {
    prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    prefersMoreContrast: window.matchMedia('(prefers-contrast: more)').matches,
  };
}

export function resolveEffectivePreferences(
  prefs: StillPreferences,
  media: SystemMediaSnapshot = readSystemMedia(),
): EffectivePreferences {
  const theme: EffectiveTheme =
    prefs.theme === 'system'
      ? media.prefersDark
        ? 'dark'
        : 'light'
      : prefs.theme;

  const highContrast = resolveHighContrast(prefs.highContrast, media.prefersMoreContrast);

  return { theme, highContrast };
}

function resolveHighContrast(mode: HighContrastMode, prefersMoreContrast: boolean): boolean {
  if (mode === 'on') {
    return true;
  }

  if (mode === 'off') {
    return false;
  }

  return prefersMoreContrast;
}

export function followsSystemPreferences(prefs: StillPreferences): boolean {
  return prefs.theme === 'system' || prefs.highContrast === 'system';
}

export function subscribeSystemPreferenceChanges(callback: () => void): () => void {
  const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const contrastQuery = window.matchMedia('(prefers-contrast: more)');

  const handler = (): void => {
    callback();
  };

  colorSchemeQuery.addEventListener('change', handler);
  contrastQuery.addEventListener('change', handler);

  return () => {
    colorSchemeQuery.removeEventListener('change', handler);
    contrastQuery.removeEventListener('change', handler);
  };
}
