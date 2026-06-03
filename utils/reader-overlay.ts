import readerStyles from '~/assets/reader.css?inline';
import type { ExtractedArticle } from './extract-article';
import {
  bumpFontSize,
  getPreferences,
  setPreferences,
  type ColumnWidth,
  type FontSize,
  type HighContrastMode,
  type LineHeight,
  type StillPreferences,
  type Theme,
} from './preferences';
import {
  followsSystemPreferences,
  resolveEffectivePreferences,
  subscribeSystemPreferenceChanges,
} from './resolve-effective-preferences';
import { t, type MessageKey } from './i18n';
import { formatReadingTime } from './reading-time';
import { restoreScrollPosition, saveScrollPosition } from './scroll-restore';
import { sanitizeArticleHtml } from './sanitize-article-html';

const OVERLAY_ID = 'still-overlay';
const GLOBAL_STYLE_ID = 'still-global-styles';
const SCROLLPORT_CLASS = 'still-scrollport';
const DOCK_HOVER_ZONE_PX = 60;

type SegmentField = 'theme' | 'fontSize' | 'columnWidth' | 'lineHeight' | 'highContrast';
type BooleanPrefField =
  | 'underlineLinks'
  | 'hideImages'
  | 'reduceMotion'
  | 'dockAlwaysVisible';

const PROGRESS_UPDATE_MIN_MS = 1000;
const PROGRESS_UPDATE_MIN_DELTA = 5;

let lockedPageScrollY: number | null = null;

export interface ReaderOverlayHandle {
  overlay: HTMLElement;
  destroy: () => void;
}

interface FloatingDockHandle {
  container: HTMLElement;
  progressText: HTMLElement;
  settingsButton: HTMLButtonElement;
  popover: HTMLElement;
  closePopover: () => void;
  isPopoverOpen: () => boolean;
  syncPreferences: (prefs: StillPreferences) => void;
}

function buildFontFace(): string {
  const fontUrl = browser.runtime.getURL('/fonts/InterVariable.ttf');

  return `
    @font-face {
      font-family: 'Inter';
      src: url('${fontUrl}') format('truetype');
      font-weight: 100 900;
      font-display: swap;
    }
  `;
}

function ensureGlobalStyles(): void {
  if (document.getElementById(GLOBAL_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = GLOBAL_STYLE_ID;
  style.textContent = `
    html.still-active,
    body.still-active {
      overflow: hidden !important;
      overscroll-behavior: none;
    }
  `;
  document.head.appendChild(style);
}

function lockPageScroll(): void {
  lockedPageScrollY = window.scrollY;
  document.documentElement.classList.add('still-active');
  document.body.classList.add('still-active');
  document.body.style.setProperty('position', 'fixed', 'important');
  document.body.style.setProperty('top', `-${lockedPageScrollY}px`, 'important');
  document.body.style.setProperty('left', '0', 'important');
  document.body.style.setProperty('right', '0', 'important');
  document.body.style.setProperty('width', '100%', 'important');
}

function unlockPageScroll(): void {
  const scrollY = lockedPageScrollY ?? 0;
  lockedPageScrollY = null;
  document.documentElement.classList.remove('still-active');
  document.body.classList.remove('still-active');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('left');
  document.body.style.removeProperty('right');
  document.body.style.removeProperty('width');
  window.scrollTo(0, scrollY);
}

function injectShadowStyles(shadow: ShadowRoot): void {
  const style = document.createElement('style');
  style.textContent = buildFontFace() + readerStyles;
  shadow.appendChild(style);
}

function getStillRoot(overlay: HTMLElement): HTMLElement | null {
  return overlay.shadowRoot?.querySelector('.still-root') ?? null;
}

function applyHideImagesToContent(root: HTMLElement, hideImages: boolean): void {
  const content = root.querySelector('.still-content');
  if (!content) {
    return;
  }

  for (const element of content.querySelectorAll('img, picture, figure')) {
    if (hideImages) {
      element.setAttribute('aria-hidden', 'true');
    } else {
      element.removeAttribute('aria-hidden');
    }
  }
}

function applyPreferencesToElement(root: HTMLElement, prefs: StillPreferences): void {
  const effective = resolveEffectivePreferences(prefs);

  root.dataset.theme = effective.theme;
  root.dataset.fontSize = prefs.fontSize;
  root.dataset.columnWidth = prefs.columnWidth;
  root.dataset.lineHeight = prefs.lineHeight;
  root.dataset.underlineLinks = prefs.underlineLinks ? 'true' : 'false';
  root.dataset.hideImages = prefs.hideImages ? 'true' : 'false';
  root.dataset.reduceMotion = prefs.reduceMotion ? 'true' : 'false';
  root.dataset.dockPinned = prefs.dockAlwaysVisible ? 'true' : 'false';
  root.dataset.highContrast = effective.highContrast ? 'true' : 'false';
  applyHideImagesToContent(root, prefs.hideImages);
}

function syncDockPreferences(root: HTMLElement, prefs: StillPreferences): void {
  for (const field of ['theme', 'fontSize', 'columnWidth', 'lineHeight', 'highContrast'] as const) {
    const buttons = root.querySelectorAll<HTMLButtonElement>(
      `.still-segment-btn[data-field="${field}"]`,
    );

    for (const button of buttons) {
      button.setAttribute('aria-checked', button.dataset.value === prefs[field] ? 'true' : 'false');
    }
  }

  for (const field of [
    'underlineLinks',
    'hideImages',
    'reduceMotion',
    'dockAlwaysVisible',
  ] as const) {
    const input = root.querySelector<HTMLInputElement>(`input[data-pref="${field}"]`);
    if (input) {
      input.checked = prefs[field];
    }
  }
}

function applyHostLayoutStyles(overlay: HTMLElement): void {
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');
  overlay.style.setProperty('display', 'block', 'important');
  overlay.style.setProperty('overflow', 'hidden', 'important');
  overlay.style.setProperty('margin', '0', 'important');
  overlay.style.setProperty('padding', '0', 'important');
  overlay.style.setProperty('border', 'none', 'important');
  overlay.style.setProperty('box-sizing', 'border-box', 'important');
}

export function applyPreferencesToOverlay(prefs: StillPreferences): void {
  const overlay = getActiveOverlay();
  const root = overlay ? getStillRoot(overlay) : null;

  if (root) {
    applyPreferencesToElement(root, prefs);
    syncDockPreferences(root, prefs);
  }
}

function segmentAriaKey(field: SegmentField, value: string): MessageKey {
  const map: Record<SegmentField, Record<string, MessageKey>> = {
    theme: {
      light: 'ariaThemeLight',
      warm: 'ariaThemeWarm',
      dark: 'ariaThemeDark',
      system: 'ariaThemeSystem',
    },
    highContrast: {
      system: 'ariaHighContrastSystem',
      on: 'ariaHighContrastOn',
      off: 'ariaHighContrastOff',
    },
    fontSize: {
      small: 'ariaFontSizeSmall',
      medium: 'ariaFontSizeMedium',
      large: 'ariaFontSizeLarge',
      xlarge: 'ariaFontSizeXlarge',
    },
    columnWidth: {
      narrow: 'ariaColumnWidthNarrow',
      default: 'ariaColumnWidthDefault',
      wide: 'ariaColumnWidthWide',
    },
    lineHeight: {
      compact: 'ariaLineHeightCompact',
      default: 'ariaLineHeightDefault',
      relaxed: 'ariaLineHeightRelaxed',
    },
  };

  return map[field][value] ?? 'ariaThemeLight';
}

/** @deprecated Use applyPreferencesToOverlay */
export function applyThemeToOverlay(theme: StillPreferences['theme']): void {
  void getPreferences().then((prefs) => {
    applyPreferencesToOverlay({ ...prefs, theme });
  });
}

function buildByline(article: ExtractedArticle, readingTime: string): string | null {
  const parts: string[] = [];

  if (article.byline && article.siteName) {
    parts.push(`${article.byline} · ${article.siteName}`);
  } else if (article.byline) {
    parts.push(article.byline);
  } else if (article.siteName) {
    parts.push(article.siteName);
  }

  if (readingTime) {
    parts.push(readingTime);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function updateProgress(
  scrollport: HTMLElement,
  progressBar: HTMLElement,
  progressText: HTMLElement | null,
  progressContainer: HTMLElement,
  state: { lastAnnounceMs: number; lastAnnouncePercent: number },
): void {
  const maxScroll = scrollport.scrollHeight - scrollport.clientHeight;
  const ratio = maxScroll > 0 ? scrollport.scrollTop / maxScroll : 0;
  const percent = Math.round(ratio * 100);
  progressBar.style.transform = `scaleX(${ratio})`;

  if (progressText) {
    progressText.textContent = t('progressRead', String(percent));
  }

  const now = Date.now();
  const delta = Math.abs(percent - state.lastAnnouncePercent);
  if (now - state.lastAnnounceMs >= PROGRESS_UPDATE_MIN_MS || delta >= PROGRESS_UPDATE_MIN_DELTA) {
    progressContainer.setAttribute('aria-valuenow', String(percent));
    state.lastAnnounceMs = now;
    state.lastAnnouncePercent = percent;
  }
}

function wrapTables(container: HTMLElement): void {
  for (const table of container.querySelectorAll('table')) {
    if (table.parentElement?.classList.contains('still-table-wrap')) {
      continue;
    }

    const wrap = document.createElement('div');
    wrap.className = 'still-table-wrap';
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(table);
  }
}

function createSegmentButton(
  field: SegmentField,
  value: string,
  label: string,
  checked: boolean,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'still-segment-btn';
  button.dataset.field = field;
  button.dataset.value = value;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', checked ? 'true' : 'false');
  button.setAttribute('aria-label', t(segmentAriaKey(field, value)));
  button.innerHTML = label;
  return button;
}

function createSegmentedControl(
  field: SegmentField,
  ariaLabel: string,
  prefs: StillPreferences,
  options: Array<{ value: string; label: string }>,
): HTMLElement {
  const control = document.createElement('div');
  control.className = 'still-segmented-control';
  control.setAttribute('role', 'radiogroup');
  control.setAttribute('aria-label', ariaLabel);

  for (const option of options) {
    control.appendChild(
      createSegmentButton(field, option.value, option.label, prefs[field] === option.value),
    );
  }

  return control;
}

function createPopoverToggle(
  field: BooleanPrefField,
  labelKey: MessageKey,
  checked: boolean,
): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'still-popover-toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.dataset.pref = field;
  input.checked = checked;

  const text = document.createElement('span');
  text.textContent = t(labelKey);

  label.append(input, text);
  return label;
}

function createFloatingDock(
  pageUrl: string,
  onExit: () => void,
  prefs: StillPreferences,
): FloatingDockHandle {
  const container = document.createElement('div');
  container.className = 'still-dock-container';

  const popover = document.createElement('div');
  popover.className = 'still-settings-popover';
  popover.id = 'still-settings-popover';
  popover.setAttribute('aria-hidden', 'true');

  const themeSection = document.createElement('div');
  themeSection.className = 'still-popover-section';
  const themeLabel = document.createElement('span');
  themeLabel.className = 'still-popover-label';
  themeLabel.textContent = t('theme');
  themeSection.appendChild(themeLabel);
  themeSection.appendChild(
    createSegmentedControl('theme', t('theme'), prefs, [
      {
        value: 'light',
        label: `<span class="theme-swatch sw-light" aria-hidden="true"></span> ${t('themeLight')}`,
      },
      {
        value: 'warm',
        label: `<span class="theme-swatch sw-warm" aria-hidden="true"></span> ${t('themeWarm')}`,
      },
      {
        value: 'dark',
        label: `<span class="theme-swatch sw-dark" aria-hidden="true"></span> ${t('themeDark')}`,
      },
      {
        value: 'system',
        label: `<span class="theme-swatch sw-system" aria-hidden="true"></span> ${t('themeSystem')}`,
      },
    ]),
  );

  const fontSizeSection = document.createElement('div');
  fontSizeSection.className = 'still-popover-section';
  const fontSizeLabel = document.createElement('span');
  fontSizeLabel.className = 'still-popover-label';
  fontSizeLabel.textContent = t('textSize');
  fontSizeSection.appendChild(fontSizeLabel);
  fontSizeSection.appendChild(
    createSegmentedControl('fontSize', t('textSize'), prefs, [
      { value: 'small', label: '<span class="still-size-label still-size-label--small">A</span>' },
      {
        value: 'medium',
        label: '<span class="still-size-label still-size-label--medium">A</span>',
      },
      { value: 'large', label: '<span class="still-size-label still-size-label--large">A</span>' },
      {
        value: 'xlarge',
        label: '<span class="still-size-label still-size-label--xlarge">A</span>',
      },
    ]),
  );

  const lineHeightSection = document.createElement('div');
  lineHeightSection.className = 'still-popover-section';
  const lineHeightLabel = document.createElement('span');
  lineHeightLabel.className = 'still-popover-label';
  lineHeightLabel.textContent = t('lineHeight');
  lineHeightSection.appendChild(lineHeightLabel);
  lineHeightSection.appendChild(
    createSegmentedControl('lineHeight', t('lineHeight'), prefs, [
      { value: 'compact', label: t('lineHeightCompact') },
      { value: 'default', label: t('lineHeightDefault') },
      { value: 'relaxed', label: t('lineHeightRelaxed') },
    ]),
  );

  const columnWidthSection = document.createElement('div');
  columnWidthSection.className = 'still-popover-section';
  const columnWidthLabel = document.createElement('span');
  columnWidthLabel.className = 'still-popover-label';
  columnWidthLabel.textContent = t('columnWidth');
  columnWidthSection.appendChild(columnWidthLabel);
  columnWidthSection.appendChild(
    createSegmentedControl('columnWidth', t('columnWidth'), prefs, [
      {
        value: 'narrow',
        label:
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="18" x2="16" y2="18"></line></svg>',
      },
      {
        value: 'default',
        label:
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="6" x2="19" y2="6"></line><line x1="5" y1="12" x2="19" y2="12"></line><line x1="5" y1="18" x2="19" y2="18"></line></svg>',
      },
      {
        value: 'wide',
        label:
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="2" y1="6" x2="22" y2="6"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="18" x2="22" y2="18"></line></svg>',
      },
    ]),
  );

  const accessibilitySection = document.createElement('div');
  accessibilitySection.className = 'still-popover-section';
  const accessibilityLabel = document.createElement('span');
  accessibilityLabel.className = 'still-popover-label';
  accessibilityLabel.textContent = t('optionsAccessibility');
  accessibilitySection.appendChild(accessibilityLabel);

  const highContrastSection = document.createElement('div');
  highContrastSection.className = 'still-popover-section';
  const highContrastLabel = document.createElement('span');
  highContrastLabel.className = 'still-popover-label';
  highContrastLabel.textContent = t('prefHighContrast');
  highContrastSection.appendChild(highContrastLabel);
  highContrastSection.appendChild(
    createSegmentedControl('highContrast', t('prefHighContrast'), prefs, [
      { value: 'system', label: t('prefHighContrastSystem') },
      { value: 'on', label: t('prefHighContrastOn') },
      { value: 'off', label: t('prefHighContrastOff') },
    ]),
  );

  const toggles = document.createElement('div');
  toggles.className = 'still-popover-toggles';
  toggles.append(
    createPopoverToggle('underlineLinks', 'prefUnderlineLinks', prefs.underlineLinks),
    createPopoverToggle('hideImages', 'prefHideImages', prefs.hideImages),
    createPopoverToggle('reduceMotion', 'prefReduceMotion', prefs.reduceMotion),
    createPopoverToggle('dockAlwaysVisible', 'prefDockAlwaysVisible', prefs.dockAlwaysVisible),
  );
  accessibilitySection.append(highContrastSection, toggles);

  popover.append(
    themeSection,
    fontSizeSection,
    lineHeightSection,
    columnWidthSection,
    accessibilitySection,
  );

  const dock = document.createElement('div');
  dock.className = 'still-dock';

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.className = 'still-dock-btn still-settings-toggle';
  settingsButton.setAttribute('aria-label', t('ariaAdjustSettings'));
  settingsButton.setAttribute('aria-expanded', 'false');
  settingsButton.setAttribute('aria-controls', 'still-settings-popover');
  settingsButton.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
      <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
      <line x1="17" y1="16" x2="23" y2="16"></line>
    </svg>
  `;

  const separator = document.createElement('div');
  separator.className = 'still-dock-separator';
  separator.setAttribute('aria-hidden', 'true');

  const progressText = document.createElement('span');
  progressText.className = 'still-dock-progress-text';
  progressText.setAttribute('aria-hidden', 'true');
  progressText.textContent = t('progressRead', '0');

  const separator2 = document.createElement('div');
  separator2.className = 'still-dock-separator';
  separator2.setAttribute('aria-hidden', 'true');

  const originalLink = document.createElement('a');
  originalLink.className = 'still-dock-link';
  originalLink.href = pageUrl;
  originalLink.target = '_blank';
  originalLink.rel = 'noopener noreferrer';
  originalLink.setAttribute('aria-label', t('ariaViewOriginal'));
  originalLink.innerHTML = `
    <span>${t('original')}</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  `;

  const exitButton = document.createElement('button');
  exitButton.type = 'button';
  exitButton.className = 'still-dock-exit-btn';
  exitButton.textContent = t('exit');
  exitButton.addEventListener('click', onExit);

  dock.append(settingsButton, separator, progressText, separator2, originalLink, exitButton);

  const dockNav = document.createElement('nav');
  dockNav.className = 'still-dock-nav';
  dockNav.setAttribute('aria-label', t('ariaDockNav'));
  dockNav.append(popover, dock);
  container.appendChild(dockNav);

  const closePopover = (): void => {
    settingsButton.setAttribute('aria-expanded', 'false');
    popover.setAttribute('aria-hidden', 'true');
    popover.classList.remove('is-open');
    settingsButton.classList.remove('is-active');
  };

  const openPopover = (): void => {
    settingsButton.setAttribute('aria-expanded', 'true');
    popover.setAttribute('aria-hidden', 'false');
    popover.classList.add('is-open');
    settingsButton.classList.add('is-active');
    popover.querySelector<HTMLButtonElement>('.still-segment-btn[aria-checked="true"]')?.focus();
  };

  settingsButton.addEventListener('click', (event) => {
    event.stopPropagation();

    if (settingsButton.getAttribute('aria-expanded') === 'true') {
      closePopover();
      settingsButton.focus();
      return;
    }

    openPopover();
  });

  for (const button of popover.querySelectorAll<HTMLButtonElement>('.still-segment-btn')) {
    button.addEventListener('click', async () => {
      const field = button.dataset.field as SegmentField;
      const value = button.dataset.value as
        | Theme
        | FontSize
        | ColumnWidth
        | LineHeight
        | HighContrastMode;

      const siblings = button.parentElement?.querySelectorAll<HTMLButtonElement>('.still-segment-btn');
      siblings?.forEach((sibling) => {
        sibling.setAttribute('aria-checked', 'false');
      });
      button.setAttribute('aria-checked', 'true');

      const current = await getPreferences();
      const next = { ...current, [field]: value };
      await setPreferences({ [field]: value });
      applyPreferencesToOverlay(next);
    });
  }

  for (const input of popover.querySelectorAll<HTMLInputElement>('input[data-pref]')) {
    input.addEventListener('change', async () => {
      const field = input.dataset.pref as BooleanPrefField;
      await setPreferences({ [field]: input.checked });
      const next = await getPreferences();
      applyPreferencesToOverlay(next);
    });
  }

  return {
    container,
    progressText,
    settingsButton,
    popover,
    closePopover,
    isPopoverOpen: () => settingsButton.getAttribute('aria-expanded') === 'true',
    syncPreferences: (nextPrefs) => {
      const root = container.closest('.still-root');
      if (root instanceof HTMLElement) {
        syncDockPreferences(root, nextPrefs);
      }
    },
  };
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null || element === container.querySelector('.still-settings-toggle'));
}

function trapFocus(event: KeyboardEvent, popover: HTMLElement, settingsButton: HTMLButtonElement): void {
  if (event.key !== 'Tab') {
    return;
  }

  const focusables = [...getFocusableElements(popover), settingsButton];
  if (focusables.length === 0) {
    return;
  }

  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function createReaderOverlay(
  article: ExtractedArticle,
  onExit: () => void,
  prefs: StillPreferences,
  previousActiveElement: HTMLElement | null = null,
): ReaderOverlayHandle {
  ensureGlobalStyles();

  const pageUrl = window.location.href;
  const sanitizedContent = sanitizeArticleHtml(article.content);
  const plainText = new DOMParser().parseFromString(sanitizedContent, 'text/html').body.textContent ?? '';
  const readingTime = formatReadingTime(plainText);

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  applyHostLayoutStyles(overlay);

  const lang = document.documentElement.lang;
  if (lang) {
    overlay.setAttribute('lang', lang);
  }

  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('ariaStillReader'));

  const shadow = overlay.attachShadow({ mode: 'open' });
  injectShadowStyles(shadow);

  const root = document.createElement('div');
  root.className = 'still-root';
  applyPreferencesToElement(root, prefs);

  const scrim = document.createElement('div');
  scrim.className = 'still-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  root.appendChild(scrim);

  const progress = document.createElement('div');
  progress.className = 'still-progress';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-valuemin', '0');
  progress.setAttribute('aria-valuemax', '100');
  progress.setAttribute('aria-valuenow', '0');
  progress.setAttribute('aria-label', t('ariaReadingProgress'));
  const progressBar = document.createElement('div');
  progressBar.className = 'still-progress__bar';
  progressBar.setAttribute('aria-hidden', 'true');
  progress.appendChild(progressBar);
  root.appendChild(progress);

  const progressState = { lastAnnounceMs: 0, lastAnnouncePercent: -PROGRESS_UPDATE_MIN_DELTA };

  const scrollport = document.createElement('div');
  scrollport.className = SCROLLPORT_CLASS;

  const main = document.createElement('main');
  main.className = 'still-main';

  const reader = document.createElement('div');
  reader.className = 'still-reader';

  const header = document.createElement('header');
  header.className = 'still-header';

  const title = document.createElement('h1');
  title.className = 'still-title';
  title.textContent = article.title;
  header.appendChild(title);

  const bylineText = buildByline(article, readingTime);
  if (bylineText) {
    const byline = document.createElement('p');
    byline.className = 'still-byline';
    byline.textContent = bylineText;
    header.appendChild(byline);
  }

  const content = document.createElement('article');
  content.id = 'still-article';
  content.className = 'still-content';
  content.tabIndex = -1;
  content.innerHTML = sanitizedContent;
  wrapTables(content);

  const skipLink = document.createElement('a');
  skipLink.className = 'still-skip-link';
  skipLink.href = '#still-article';
  skipLink.textContent = t('skipToArticle');
  skipLink.addEventListener('click', (event) => {
    event.preventDefault();
    content.focus({ preventScroll: true });
    content.scrollIntoView({ block: 'start' });
  });

  reader.append(header, content);
  main.appendChild(reader);
  scrollport.append(skipLink, main);
  root.appendChild(scrollport);

  applyHideImagesToContent(root, prefs.hideImages);

  const dock = createFloatingDock(pageUrl, onExit, prefs);
  root.appendChild(dock.container);

  shadow.appendChild(root);
  document.body.appendChild(overlay);
  lockPageScroll();

  requestAnimationFrame(() => {
    skipLink.focus();
  });

  let lastScrollTop = 0;

  const showDock = (): void => {
    dock.container.classList.remove('is-hidden');
  };

  const hideDock = (): void => {
    if (dock.isPopoverOpen()) {
      return;
    }
    dock.container.classList.add('is-hidden');
  };

  const handleScroll = (): void => {
    const scrollTop = scrollport.scrollTop;
    updateProgress(
      scrollport,
      progressBar,
      dock.progressText,
      progress,
      progressState,
    );

    const dockPinned = root.dataset.dockPinned === 'true';
    if (!dockPinned && scrollTop > lastScrollTop && scrollTop > 100) {
      hideDock();
    } else {
      showDock();
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  };

  const handleMouseMove: EventListener = (event): void => {
    const distanceFromBottom = window.innerHeight - (event as MouseEvent).clientY;
    if (distanceFromBottom <= DOCK_HOVER_ZONE_PX) {
      showDock();
    }
  };

  const handleShadowClick: EventListener = (event): void => {
    if (!dock.isPopoverOpen()) {
      return;
    }

    const target = event.target as Node;
    if (!dock.container.contains(target)) {
      dock.closePopover();
      dock.settingsButton.focus();
    }
  };

  scrollport.addEventListener('scroll', handleScroll, { passive: true });
  shadow.addEventListener('mousemove', handleMouseMove);
  shadow.addEventListener('mousedown', handleShadowClick);
  requestAnimationFrame(handleScroll);

  restoreScrollPosition(scrollport, pageUrl);

  async function adjustFontSize(direction: 1 | -1): Promise<void> {
    const current = await getPreferences();
    const nextSize = bumpFontSize(current.fontSize, direction);

    if (nextSize === current.fontSize) {
      return;
    }

    const next = { ...current, fontSize: nextSize };
    await setPreferences({ fontSize: nextSize });
    applyPreferencesToOverlay(next);
  }

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();

      if (dock.isPopoverOpen()) {
        dock.closePopover();
        dock.settingsButton.focus();
        return;
      }

      onExit();
      return;
    }

    if (dock.isPopoverOpen()) {
      trapFocus(event, dock.popover, dock.settingsButton);
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      void adjustFontSize(1);
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      void adjustFontSize(-1);
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  const unsubscribeSystem = subscribeSystemPreferenceChanges(() => {
    void getPreferences().then((current) => {
      if (!followsSystemPreferences(current)) {
        return;
      }

      applyPreferencesToOverlay(current);
    });
  });

  return {
    overlay,
    destroy: () => {
      unsubscribeSystem();
      saveScrollPosition(pageUrl, scrollport.scrollTop);
      scrollport.removeEventListener('scroll', handleScroll);
      shadow.removeEventListener('mousemove', handleMouseMove);
      shadow.removeEventListener('mousedown', handleShadowClick);
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      unlockPageScroll();

      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus({ preventScroll: true });
      }
    },
  };
}

export function getActiveOverlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}
