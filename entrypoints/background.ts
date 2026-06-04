import {
  clearFullscreenSession,
  consumeFullscreenSession,
  normalizeRestorableWindowState,
  trackFullscreenSession,
} from '~/utils/fullscreen-session';
import { getPreferences } from '~/utils/preferences';

const ENTER_STILL_MESSAGE = { type: 'ENTER_STILL' } as const;
const EXIT_STILL_MESSAGE = { type: 'EXIT_STILL' } as const;

async function maybeEnterFullscreenForTab(tab: Browser.tabs.Tab): Promise<void> {
  if (!tab.id || tab.windowId === undefined) {
    return;
  }

  const prefs = await getPreferences();
  if (!prefs.enterFullscreenOnOpen) {
    return;
  }

  const window = await browser.windows.get(tab.windowId);
  if (window.state === 'fullscreen') {
    return;
  }

  trackFullscreenSession(tab.id, {
    windowId: tab.windowId,
    priorState: normalizeRestorableWindowState(window.state),
  });

  await browser.windows.update(tab.windowId, { state: 'fullscreen' });
}

async function restoreFullscreenForTab(tabId: number): Promise<void> {
  const session = consumeFullscreenSession(tabId);
  if (!session) {
    return;
  }

  try {
    const window = await browser.windows.get(session.windowId);
    if (window.state !== 'fullscreen') {
      return;
    }

    await browser.windows.update(session.windowId, { state: session.priorState });
  } catch {
    // Window may have been closed.
  }
}

async function triggerStill(tab: Browser.tabs.Tab): Promise<void> {
  if (!tab.id) {
    return;
  }

  await maybeEnterFullscreenForTab(tab);

  try {
    await browser.tabs.sendMessage(tab.id, ENTER_STILL_MESSAGE);
  } catch {
    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/content-scripts/content.js'],
      });
      await browser.tabs.sendMessage(tab.id, ENTER_STILL_MESSAGE);
    } catch {
      void restoreFullscreenForTab(tab.id);
      // Restricted pages (chrome://, Web Store, PDFs, etc.)
    }
  }
}

async function triggerStillOnActiveTab(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    return;
  }

  await triggerStill(tab);
}

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    await triggerStill(tab);
  });

  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-still') {
      void triggerStillOnActiveTab();
    }
  });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === EXIT_STILL_MESSAGE.type && sender.tab?.id) {
      void restoreFullscreenForTab(sender.tab.id);
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    clearFullscreenSession(tabId);
  });
});
