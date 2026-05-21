import { extractArticle } from '~/utils/extract-article';
import { createReaderOverlay, getActiveOverlay, type ReaderOverlayHandle } from '~/utils/reader-overlay';
import { showToast } from '~/utils/toast';

let activeReader: ReaderOverlayHandle | null = null;

function exitZenMode(): void {
  activeReader?.destroy();
  activeReader = null;
}

function enterZenMode(): void {
  if (getActiveOverlay()) {
    exitZenMode();
    return;
  }

  const article = extractArticle();

  if (!article) {
    showToast("Couldn't find article content on this page.");
    return;
  }

  activeReader = createReaderOverlay(
    article,
    exitZenMode,
    () => {
      showToast('Done reading', 1000);
      window.setTimeout(exitZenMode, 1000);
    },
  );
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === 'ENTER_ZEN') {
        enterZenMode();
      }
    });
  },
});
