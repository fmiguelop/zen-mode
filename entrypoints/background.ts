import {
  clearFullscreenSession,
  consumeFullscreenSession,
  normalizeRestorableWindowState,
  trackFullscreenSession,
} from '~/utils/fullscreen-session';
import { getPreferences } from '~/utils/preferences';
import { activateStillOnTab, READER_SCRIPT_PATH } from '~/utils/still-activation';

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
  const tabId = tab.id;
  if (tabId === undefined) {
    return;
  }

  await maybeEnterFullscreenForTab(tab);

  await activateStillOnTab(
    tabId,
    (id, message) => browser.tabs.sendMessage(id, message),
    (details) =>
      browser.scripting.executeScript({
        target: { tabId: details.target.tabId },
        files: [READER_SCRIPT_PATH],
      }),
    () => restoreFullscreenForTab(tabId),
  );
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
