import { extractArticle } from '~/utils/extract-article';
import {
  getPreferences,
  onPreferencesChanged,
  type StillPreferences,
} from '~/utils/preferences';
import {
  applyPreferencesToOverlay,
  createReaderOverlay,
  getActiveOverlay,
  type ReaderOverlayHandle,
} from '~/utils/reader-overlay';
import { t } from '~/utils/i18n';
import { showToast } from '~/utils/toast';

const STILL_READER_INITIALIZED_KEY = '__stillReaderInitialized';

let activeReader: ReaderOverlayHandle | null = null;
let focusBeforeStill: HTMLElement | null = null;
let cachedPrefs: StillPreferences | null = null;

function prefersReducedMotion(prefs: StillPreferences | null): boolean {
  if (prefs?.reduceMotion) {
    return true;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runViewTransition(updateDom: () => void, prefs: StillPreferences | null): void {
  if (document.startViewTransition && !prefersReducedMotion(prefs)) {
    document.startViewTransition(updateDom);
    return;
  }

  updateDom();
}

function notifyExitStill(): void {
  void browser.runtime.sendMessage({ type: 'EXIT_STILL' }).catch(() => {
    // Background may be unavailable during extension reload.
  });
}

function exitStill(): void {
  const performExit = (): void => {
    activeReader?.destroy();
    activeReader = null;
    focusBeforeStill = null;
    notifyExitStill();
  };

  runViewTransition(performExit, cachedPrefs);
}

async function enterStill(): Promise<void> {
  if (getActiveOverlay()) {
    exitStill();
    return;
  }

  const article = extractArticle();

  if (!article) {
    showToast(t('errorNoArticle'));
    notifyExitStill();
    return;
  }

  const active = document.activeElement;
  focusBeforeStill = active instanceof HTMLElement ? active : null;

  const prefs = await getPreferences();
  cachedPrefs = prefs;

  const performEnter = (): void => {
    activeReader = createReaderOverlay(article, exitStill, prefs, focusBeforeStill);
  };

  runViewTransition(performEnter, prefs);
}

function initializeReader(): void {
  const globalScope = globalThis as typeof globalThis & {
    [STILL_READER_INITIALIZED_KEY]?: boolean;
  };

  if (globalScope[STILL_READER_INITIALIZED_KEY]) {
    return;
  }

  globalScope[STILL_READER_INITIALIZED_KEY] = true;

  void getPreferences().then((prefs) => {
    cachedPrefs = prefs;
  });

  onPreferencesChanged((prefs) => {
    cachedPrefs = prefs;

    if (getActiveOverlay()) {
      applyPreferencesToOverlay(prefs);
    }
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message?.type === 'ENTER_STILL') {
      void enterStill();
    }
  });
}

export default defineUnlistedScript(initializeReader);
