export type Theme = 'light' | 'dark' | 'warm' | 'system';
export type EffectiveTheme = Exclude<Theme, 'system'>;
export type HighContrastMode = 'system' | 'on' | 'off';
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ColumnWidth = 'narrow' | 'default' | 'wide';
export type LineHeight = 'compact' | 'default' | 'relaxed';
export type FontFamily = 'inter' | 'atkinson' | 'system';

export interface StillPreferences {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  columnWidth: ColumnWidth;
  lineHeight: LineHeight;
  underlineLinks: boolean;
  hideImages: boolean;
  reduceMotion: boolean;
  dockAlwaysVisible: boolean;
  highContrast: HighContrastMode;
}

const STORAGE_KEY = 'stillPreferences';
const LEGACY_THEME_KEY = 'theme';

export const DEFAULT_PREFERENCES: StillPreferences = {
  theme: 'system',
  fontFamily: 'inter',
  fontSize: 'medium',
  columnWidth: 'default',
  lineHeight: 'default',
  underlineLinks: false,
  hideImages: false,
  reduceMotion: false,
  dockAlwaysVisible: false,
  highContrast: 'system',
};

const FONT_SIZE_ORDER: FontSize[] = ['small', 'medium', 'large', 'xlarge'];

function isTheme(value: unknown): value is Theme {
  return (
    value === 'light' ||
    value === 'dark' ||
    value === 'warm' ||
    value === 'system'
  );
}

function isHighContrastMode(value: unknown): value is HighContrastMode {
  return value === 'system' || value === 'on' || value === 'off';
}

function normalizeHighContrast(value: unknown): HighContrastMode {
  if (isHighContrastMode(value)) {
    return value;
  }

  if (value === true) {
    return 'on';
  }

  if (value === false) {
    return 'off';
  }

  return 'off';
}

function isFontSize(value: unknown): value is FontSize {
  return (
    value === 'small' ||
    value === 'medium' ||
    value === 'large' ||
    value === 'xlarge'
  );
}

function isColumnWidth(value: unknown): value is ColumnWidth {
  return value === 'narrow' || value === 'default' || value === 'wide';
}

function isLineHeight(value: unknown): value is LineHeight {
  return value === 'compact' || value === 'default' || value === 'relaxed';
}

function isFontFamily(value: unknown): value is FontFamily {
  return value === 'inter' || value === 'atkinson' || value === 'system';
}

function isBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeStillPreferences(
  raw: unknown,
  legacyTheme?: unknown,
): StillPreferences {
  const prefs = raw && typeof raw === 'object' ? (raw as Partial<StillPreferences>) : {};
  const theme = isTheme(prefs.theme)
    ? prefs.theme
    : isTheme(legacyTheme)
      ? legacyTheme
      : DEFAULT_PREFERENCES.theme;

  return {
    theme,
    fontFamily: isFontFamily(prefs.fontFamily)
      ? prefs.fontFamily
      : DEFAULT_PREFERENCES.fontFamily,
    fontSize: isFontSize(prefs.fontSize) ? prefs.fontSize : DEFAULT_PREFERENCES.fontSize,
    columnWidth: isColumnWidth(prefs.columnWidth)
      ? prefs.columnWidth
      : DEFAULT_PREFERENCES.columnWidth,
    lineHeight: isLineHeight(prefs.lineHeight)
      ? prefs.lineHeight
      : DEFAULT_PREFERENCES.lineHeight,
    underlineLinks: isBoolean(prefs.underlineLinks, DEFAULT_PREFERENCES.underlineLinks),
    hideImages: isBoolean(prefs.hideImages, DEFAULT_PREFERENCES.hideImages),
    reduceMotion: isBoolean(prefs.reduceMotion, DEFAULT_PREFERENCES.reduceMotion),
    dockAlwaysVisible: isBoolean(
      prefs.dockAlwaysVisible,
      DEFAULT_PREFERENCES.dockAlwaysVisible,
    ),
    highContrast: normalizeHighContrast(prefs.highContrast),
  };
}

export async function getPreferences(): Promise<StillPreferences> {
  const result = await browser.storage.sync.get([STORAGE_KEY, LEGACY_THEME_KEY]);
  return normalizeStillPreferences(result[STORAGE_KEY], result[LEGACY_THEME_KEY]);
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
      callback(normalizeStillPreferences(changes[STORAGE_KEY].newValue));
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
