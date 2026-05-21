export type Theme = 'light' | 'dark' | 'warm';
export type FontSize = 'small' | 'medium' | 'large';
export type ColumnWidth = 'narrow' | 'default' | 'wide';

export interface StillPreferences {
  theme: Theme;
  fontSize: FontSize;
  columnWidth: ColumnWidth;
}

const STORAGE_KEY = 'stillPreferences';
const LEGACY_THEME_KEY = 'theme';

export const DEFAULT_PREFERENCES: StillPreferences = {
  theme: 'light',
  fontSize: 'medium',
  columnWidth: 'default',
};

const FONT_SIZE_ORDER: FontSize[] = ['small', 'medium', 'large'];

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'warm';
}

function isFontSize(value: unknown): value is FontSize {
  return value === 'small' || value === 'medium' || value === 'large';
}

function isColumnWidth(value: unknown): value is ColumnWidth {
  return value === 'narrow' || value === 'default' || value === 'wide';
}

function normalizePreferences(raw: unknown, legacyTheme?: unknown): StillPreferences {
  const prefs = raw && typeof raw === 'object' ? (raw as Partial<StillPreferences>) : {};
  const theme = isTheme(prefs.theme)
    ? prefs.theme
    : isTheme(legacyTheme)
      ? legacyTheme
      : DEFAULT_PREFERENCES.theme;

  return {
    theme,
    fontSize: isFontSize(prefs.fontSize) ? prefs.fontSize : DEFAULT_PREFERENCES.fontSize,
    columnWidth: isColumnWidth(prefs.columnWidth)
      ? prefs.columnWidth
      : DEFAULT_PREFERENCES.columnWidth,
  };
}

export async function getPreferences(): Promise<StillPreferences> {
  const result = await browser.storage.sync.get([STORAGE_KEY, LEGACY_THEME_KEY]);
  return normalizePreferences(result[STORAGE_KEY], result[LEGACY_THEME_KEY]);
}

export async function setPreferences(partial: Partial<StillPreferences>): Promise<void> {
  const current = await getPreferences();
  const next = { ...current, ...partial };
  await browser.storage.sync.set({ [STORAGE_KEY]: next });
}

export function bumpFontSize(current: FontSize, direction: 1 | -1): FontSize {
  const index = FONT_SIZE_ORDER.indexOf(current);
  const nextIndex = Math.max(0, Math.min(FONT_SIZE_ORDER.length - 1, index + direction));
  return FONT_SIZE_ORDER[nextIndex]!;
}

export function onPreferencesChanged(callback: (prefs: StillPreferences) => void): void {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }

    if (STORAGE_KEY in changes) {
      callback(normalizePreferences(changes[STORAGE_KEY].newValue));
      return;
    }

    if (LEGACY_THEME_KEY in changes && isTheme(changes[LEGACY_THEME_KEY].newValue)) {
      void getPreferences().then(callback);
    }
  });
}

/** @deprecated Use getPreferences */
export async function getTheme(): Promise<Theme> {
  return (await getPreferences()).theme;
}

/** @deprecated Use setPreferences */
export async function setTheme(theme: Theme): Promise<void> {
  await setPreferences({ theme });
}

/** @deprecated Use onPreferencesChanged */
export function onThemeChanged(callback: (theme: Theme) => void): void {
  onPreferencesChanged((prefs) => callback(prefs.theme));
}
