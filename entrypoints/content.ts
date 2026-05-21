import { extractArticle } from '~/utils/extract-article';
import { getPreferences, onPreferencesChanged } from '~/utils/preferences';
import {
  applyPreferencesToOverlay,
  createReaderOverlay,
  getActiveOverlay,
  type ReaderOverlayHandle,
} from '~/utils/reader-overlay';
import { showToast } from '~/utils/toast';

let activeReader: ReaderOverlayHandle | null = null;

function exitStill(): void {
  activeReader?.destroy();
  activeReader = null;
}

async function enterStill(): Promise<void> {
  if (getActiveOverlay()) {
    exitStill();
    return;
  }

  const article = extractArticle();

  if (!article) {
    showToast("Couldn't find article content on this page.");
    return;
  }

  const prefs = await getPreferences();
  activeReader = createReaderOverlay(article, exitStill, prefs);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    onPreferencesChanged((prefs) => {
      if (getActiveOverlay()) {
        applyPreferencesToOverlay(prefs);
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === 'ENTER_STILL') {
        void enterStill();
      }
    });
  },
});
