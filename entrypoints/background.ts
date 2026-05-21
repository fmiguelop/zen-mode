const ENTER_STILL_MESSAGE = { type: 'ENTER_STILL' } as const;

async function triggerStill(tabId: number): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, ENTER_STILL_MESSAGE);
  } catch {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['/content-scripts/content.js'],
      });
      await browser.tabs.sendMessage(tabId, ENTER_STILL_MESSAGE);
    } catch {
      // Restricted pages (chrome://, Web Store, PDFs, etc.)
    }
  }
}

async function triggerStillOnActiveTab(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return;
  }

  await triggerStill(tab.id);
}

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
      return;
    }

    await triggerStill(tab.id);
  });

  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-still') {
      void triggerStillOnActiveTab();
    }
  });
});
