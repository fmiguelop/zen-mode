import readerStyles from '~/assets/reader.css?inline';
import type { ExtractedArticle } from './extract-article';

const OVERLAY_ID = 'still-overlay';
const STYLE_ID = 'still-styles';

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

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = buildFontFace() + readerStyles;
  document.head.appendChild(style);
}

function buildByline(article: ExtractedArticle): string | null {
  if (article.byline && article.siteName) {
    return `${article.byline} · ${article.siteName}`;
  }

  return article.byline ?? article.siteName;
}

export function createReaderOverlay(
  article: ExtractedArticle,
  onExit: () => void,
): ReaderOverlayHandle {
  ensureStyles();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'still-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Still reader');

  const reader = document.createElement('div');
  reader.className = 'still-reader';

  const header = document.createElement('header');
  header.className = 'still-header';

  const title = document.createElement('h1');
  title.className = 'still-title';
  title.textContent = article.title;
  header.appendChild(title);

  const bylineText = buildByline(article);
  if (bylineText) {
    const byline = document.createElement('p');
    byline.className = 'still-byline';
    byline.textContent = bylineText;
    header.appendChild(byline);
  }

  const content = document.createElement('article');
  content.className = 'still-content';
  content.innerHTML = article.content;

  const footer = document.createElement('footer');
  footer.className = 'still-footer';

  const exitHint = document.createElement('span');
  exitHint.textContent = 'Press Esc to exit';

  const exitButton = document.createElement('button');
  exitButton.type = 'button';
  exitButton.className = 'still-exit-btn';
  exitButton.textContent = 'Exit Still';
  exitButton.addEventListener('click', onExit);

  footer.appendChild(exitHint);
  footer.appendChild(exitButton);

  reader.appendChild(header);
  reader.appendChild(content);
  reader.appendChild(footer);
  overlay.appendChild(reader);
  document.body.appendChild(overlay);
  document.body.classList.add('still-active');

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExit();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return {
    overlay,
    destroy: () => {
      document.removeEventListener('keydown', handleKeyDown);
      overlay.remove();
      document.body.classList.remove('still-active');

      if (!document.getElementById(OVERLAY_ID)) {
        document.getElementById(STYLE_ID)?.remove();
      }
    },
  };
}

export function getActiveOverlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}
