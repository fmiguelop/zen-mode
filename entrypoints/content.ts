import { extractArticle } from '~/utils/extract-article';
import { getPreferences, onPreferencesChanged } from '~/utils/preferences';
import {
  applyPreferencesToOverlay,
  createReaderOverlay,
  getActiveOverlay,
  type ReaderOverlayHandle,
} from '~/utils/reader-overlay';
import { t } from '~/utils/i18n';
import { showToast } from '~/utils/toast';

let activeReader: ReaderOverlayHandle | null = null;
let focusBeforeStill: HTMLElement | null = null;

function exitStill(): void {
  activeReader?.destroy();
  activeReader = null;
  focusBeforeStill = null;
}

async function enterStill(): Promise<void> {
  if (getActiveOverlay()) {
    exitStill();
    return;
  }

  const article = extractArticle();

  if (!article) {
    showToast(t('errorNoArticle'));
    return;
  }

  const active = document.activeElement;
  focusBeforeStill = active instanceof HTMLElement ? active : null;

  const prefs = await getPreferences();
  activeReader = createReaderOverlay(article, exitStill, prefs, focusBeforeStill);
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
