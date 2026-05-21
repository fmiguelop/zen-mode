const ENTER_STILL_MESSAGE = { type: 'ENTER_STILL' } as const;

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
      return;
    }

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
        // Restricted pages (chrome://, Web Store, PDFs, etc.)
      }
    }
  });
});
