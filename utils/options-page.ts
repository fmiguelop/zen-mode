import {
  getPreferences,
  setPreferences,
  type ColumnWidth,
  type FontFamily,
  type FontSize,
  type HighContrastMode,
  type LineHeight,
  type StillPreferences,
  type Theme,
} from '~/utils/preferences';
import {
  followsSystemPreferences,
  subscribeSystemPreferenceChanges,
} from '~/utils/resolve-effective-preferences';
import { getUiLanguage, t, type MessageKey } from '~/utils/i18n';

type SegmentField =
  | 'theme'
  | 'fontFamily'
  | 'fontSize'
  | 'columnWidth'
  | 'lineHeight'
  | 'highContrast';
type BooleanPrefField =
  | 'underlineLinks'
  | 'hideImages'
  | 'reduceMotion'
  | 'dockAlwaysVisible'
  | 'enterFullscreenOnOpen';

function applyStaticTranslations(): void {
  document.documentElement.lang = getUiLanguage();
  document.title = t('optionsPageTitle');

  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = element.dataset.i18n as MessageKey | undefined;
    if (key) {
      element.textContent = t(key);
    }
  }

  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    const key = element.dataset.i18nAria as MessageKey | undefined;
    if (key) {
      element.setAttribute('aria-label', t(key));
    }
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('.still-segment-btn[data-aria-key]')) {
    const key = button.dataset.ariaKey as MessageKey | undefined;
    if (key) {
      button.setAttribute('aria-label', t(key));
    }
  }

  const toggleParagraph = document.getElementById('options-keyboard-toggle');
  if (toggleParagraph) {
    toggleParagraph.innerHTML = [
      t('optionsKeyboardToggleIntro'),
      '<kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>',
      t('optionsKeyboardToggleMac'),
      '<kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>)',
    ].join(' ');
  }

  const shortcutParagraph = document.getElementById('options-shortcut-help');
  if (shortcutParagraph) {
    const shortcutKey =
      import.meta.env.BROWSER === 'firefox' ? 'optionsShortcutFirefox' : 'optionsShortcutChrome';
    shortcutParagraph.textContent = t(shortcutKey);
  }
}

function syncSegmentGroup(field: SegmentField, value: StillPreferences[SegmentField]): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    `.still-segment-btn[data-field="${field}"]`,
  );

  for (const button of buttons) {
    button.setAttribute('aria-checked', button.dataset.value === value ? 'true' : 'false');
  }
}

function syncAllSegments(prefs: StillPreferences): void {
  for (const field of [
    'theme',
    'fontFamily',
    'fontSize',
    'columnWidth',
    'lineHeight',
    'highContrast',
  ] as const) {
    syncSegmentGroup(field, prefs[field]);
  }
}

function syncBooleanPref(field: BooleanPrefField, value: boolean): void {
  const input = document.querySelector<HTMLInputElement>(`input[data-pref="${field}"]`);
  if (input) {
    input.checked = value;
  }
}

function bindSegmentGroup(field: SegmentField): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    `.still-segment-btn[data-field="${field}"]`,
  );

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      const value = button.dataset.value as
        | Theme
        | FontFamily
        | FontSize
        | ColumnWidth
        | LineHeight
        | HighContrastMode;

      syncSegmentGroup(field, value);
      await setPreferences({ [field]: value });
    });
  }
}

function bindBooleanPrefs(): void {
  for (const input of document.querySelectorAll<HTMLInputElement>('input[data-pref]')) {
    const field = input.dataset.pref as BooleanPrefField | undefined;
    if (!field) {
      continue;
    }

    input.addEventListener('change', async () => {
      await setPreferences({ [field]: input.checked });
    });
  }
}

async function init(): Promise<void> {
  applyStaticTranslations();

  const prefs = await getPreferences();

  syncAllSegments(prefs);
  syncBooleanPref('underlineLinks', prefs.underlineLinks);
  syncBooleanPref('hideImages', prefs.hideImages);
  syncBooleanPref('reduceMotion', prefs.reduceMotion);
  syncBooleanPref('dockAlwaysVisible', prefs.dockAlwaysVisible);
  syncBooleanPref('enterFullscreenOnOpen', prefs.enterFullscreenOnOpen);

  subscribeSystemPreferenceChanges(() => {
    void getPreferences().then((current) => {
      if (!followsSystemPreferences(current)) {
        return;
      }

      syncAllSegments(current);
    });
  });
}

bindSegmentGroup('theme');
bindSegmentGroup('fontFamily');
bindSegmentGroup('fontSize');
bindSegmentGroup('columnWidth');
bindSegmentGroup('lineHeight');
bindSegmentGroup('highContrast');
bindBooleanPrefs();

void init();
