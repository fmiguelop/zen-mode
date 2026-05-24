import readerStyles from '~/assets/reader.css?inline';
import type { ExtractedArticle } from './extract-article';
import {
  bumpFontSize,
  getPreferences,
  setPreferences,
  type StillPreferences,
} from './preferences';
import { formatReadingTime } from './reading-time';
import { restoreScrollPosition, saveScrollPosition } from './scroll-restore';
import { sanitizeArticleHtml } from './sanitize-article-html';

const OVERLAY_ID = 'still-overlay';
const GLOBAL_STYLE_ID = 'still-global-styles';

export interface ReaderOverlayHandle {
  overlay: HTMLElement;
  destroy: () => void;
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
  style.textContent = 'body.still-active { overflow: hidden; }';
  document.head.appendChild(style);
}

function injectShadowStyles(shadow: ShadowRoot): void {
  const style = document.createElement('style');
  style.textContent = buildFontFace() + readerStyles;
  shadow.appendChild(style);
}

function applyPreferencesToElement(overlay: HTMLElement, prefs: StillPreferences): void {
  overlay.dataset.theme = prefs.theme;
  overlay.dataset.fontSize = prefs.fontSize;
  overlay.dataset.columnWidth = prefs.columnWidth;
}

export function applyPreferencesToOverlay(prefs: StillPreferences): void {
  const overlay = getActiveOverlay();

  if (overlay) {
    applyPreferencesToElement(overlay, prefs);
  }
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

function updateProgress(overlay: HTMLElement, progressBar: HTMLElement): void {
  const maxScroll = overlay.scrollHeight - overlay.clientHeight;
  const ratio = maxScroll > 0 ? overlay.scrollTop / maxScroll : 0;
  progressBar.style.transform = `scaleX(${ratio})`;
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

export function createReaderOverlay(
  article: ExtractedArticle,
  onExit: () => void,
  prefs: StillPreferences,
): ReaderOverlayHandle {
  ensureGlobalStyles();

  const pageUrl = window.location.href;
  const sanitizedContent = sanitizeArticleHtml(article.content);
  const plainText = new DOMParser().parseFromString(sanitizedContent, 'text/html').body.textContent ?? '';
  const readingTime = formatReadingTime(plainText);

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  applyPreferencesToElement(overlay, prefs);

  const lang = document.documentElement.lang;
  if (lang) {
    overlay.setAttribute('lang', lang);
  }

  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Still reader');

  const shadow = overlay.attachShadow({ mode: 'open' });
  injectShadowStyles(shadow);

  const progress = document.createElement('div');
  progress.className = 'still-progress';
  progress.setAttribute('aria-hidden', 'true');
  const progressBar = document.createElement('div');
  progressBar.className = 'still-progress__bar';
  progress.appendChild(progressBar);
  shadow.appendChild(progress);

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
  content.className = 'still-content';
  content.innerHTML = sanitizedContent;
  wrapTables(content);

  const footer = document.createElement('footer');
  footer.className = 'still-footer';

  const exitHint = document.createElement('span');
  exitHint.className = 'still-footer-hint';
  exitHint.textContent = 'Press Esc to exit · + − to adjust text size';

  const footerActions = document.createElement('div');
  footerActions.className = 'still-footer-actions';

  const originalLink = document.createElement('a');
  originalLink.className = 'still-original-link';
  originalLink.href = pageUrl;
  originalLink.target = '_blank';
  originalLink.rel = 'noopener noreferrer';
  originalLink.textContent = 'View original';

  const exitButton = document.createElement('button');
  exitButton.type = 'button';
  exitButton.className = 'still-exit-btn';
  exitButton.textContent = 'Exit Still';
  exitButton.addEventListener('click', onExit);

  footerActions.appendChild(originalLink);
  footerActions.appendChild(exitButton);
  footer.appendChild(exitHint);
  footer.appendChild(footerActions);

  reader.appendChild(header);
  reader.appendChild(content);
  reader.appendChild(footer);
  shadow.appendChild(reader);
  document.body.appendChild(overlay);
  document.body.classList.add('still-active');

  const handleScroll = (): void => updateProgress(overlay, progressBar);
  overlay.addEventListener('scroll', handleScroll, { passive: true });
  requestAnimationFrame(handleScroll);

  restoreScrollPosition(overlay, pageUrl);

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExit();
      return;
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

  document.addEventListener('keydown', handleKeyDown);

  return {
    overlay,
    destroy: () => {
      saveScrollPosition(pageUrl, overlay.scrollTop);
      overlay.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      document.body.classList.remove('still-active');
    },
  };
}

export function getActiveOverlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}
