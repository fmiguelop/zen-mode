const ENTER_ZEN_MESSAGE = { type: 'ENTER_ZEN' } as const;

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
      return;
    }

    try {
      await browser.tabs.sendMessage(tab.id, ENTER_ZEN_MESSAGE);
    } catch {
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['/content-scripts/content.js'],
        });
        await browser.tabs.sendMessage(tab.id, ENTER_ZEN_MESSAGE);
      } catch {
        // Restricted pages (chrome://, Web Store, PDFs, etc.)
      }
    }
  });
});
