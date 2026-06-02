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
const SCROLLPORT_CLASS = 'still-scrollport';

let lockedPageScrollY: number | null = null;

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

function applyPreferencesToElement(root: HTMLElement, prefs: StillPreferences): void {
  root.dataset.theme = prefs.theme;
  root.dataset.fontSize = prefs.fontSize;
  root.dataset.columnWidth = prefs.columnWidth;
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
  applyHostLayoutStyles(overlay);

  const lang = document.documentElement.lang;
  if (lang) {
    overlay.setAttribute('lang', lang);
  }

  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Still reader');

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
  progress.setAttribute('aria-hidden', 'true');
  const progressBar = document.createElement('div');
  progressBar.className = 'still-progress__bar';
  progress.appendChild(progressBar);

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
  root.appendChild(reader);

  const scrollport = document.createElement('div');
  scrollport.className = SCROLLPORT_CLASS;
  scrollport.appendChild(root);

  shadow.appendChild(progress);
  shadow.appendChild(scrollport);
  document.body.appendChild(overlay);
  lockPageScroll();

  const handleScroll = (): void => updateProgress(scrollport, progressBar);
  scrollport.addEventListener('scroll', handleScroll, { passive: true });
  requestAnimationFrame(handleScroll);

  restoreScrollPosition(scrollport, pageUrl);

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
      saveScrollPosition(pageUrl, scrollport.scrollTop);
      scrollport.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      unlockPageScroll();
    },
  };
}

export function getActiveOverlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}
