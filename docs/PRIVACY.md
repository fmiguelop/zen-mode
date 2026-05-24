# Privacy Policy — Still

**Last updated:** May 24, 2026

Still ("the Extension") is a browser extension that provides a distraction-free reader mode for web articles. This policy explains what data the Extension accesses and how it is handled.

## Summary

Still does **not** collect personal information, track browsing history, store article text, or send your reading data to Still-operated servers. All article extraction happens locally in your browser.

Optional **reading preferences** (theme, text size, column width) may be saved on your device and, if you use Chrome sync, across your signed-in Chrome profiles. See [Preferences and session data](#preferences-and-session-data) below.

## Data Collection

Still does **not**:

- Collect personal information
- Track browsing history
- Store article content after you exit Still
- Send data to Still-operated servers
- Use analytics or telemetry
- Require an account or login

## Preferences and session data

Still stores a small amount of non-article data to improve your reading experience:

| Data | Where | Scope | Purpose |
|------|-------|-------|---------|
| Theme, text size, column width | `chrome.storage.sync` (key: `stillPreferences`) | Stored on your device; synced across Chrome profiles if browser sync is enabled | Your chosen reader display settings |
| Scroll position per page URL | `sessionStorage` (key: `still-scroll:{url}`) | Current browser tab session only; cleared when the tab or session ends | Resume scroll position when you re-open Still on the same page |

Still does **not** persist extracted article HTML or text, upload URLs to Still, or record which sites you read.

## Data Processing

When you activate Still (toolbar icon or keyboard shortcut), the Extension:

1. Reads the DOM (HTML structure) of the **current tab only**
2. Extracts the main article content using Mozilla Readability, running entirely on your device
3. Displays the extracted content in a local overlay within the same tab

Extracted article content exists only in memory for the duration of the reading session and is discarded when you exit Still or close the tab. Still does not write article content to disk or transmit it to external servers.

## Permissions

Still requests the following browser permissions:

| Permission | Why |
|---|---|
| `activeTab` | Access the current tab when you activate Still (toolbar or keyboard shortcut) |
| `scripting` | Inject the content script on first use if not already loaded |
| `storage` | Save optional reading preferences (theme, text size, column width) |
| `<all_urls>` (host access) | Read page content on whichever site you choose to use Still on |

The default keyboard shortcut is `Alt+Shift+S` (Mac: `Option+Shift+S`). You can change it in Chrome's extension shortcuts settings (`chrome://extensions/shortcuts`). Still does not log or transmit which pages you use.

Still does not access tabs you have not explicitly activated. It does not run in the background on pages you haven't interacted with.

## Third-Party Services

Still does not integrate with any third-party services, APIs, or external data processors. Article extraction uses [Mozilla Readability](https://github.com/mozilla/readability) as a local library inside the Extension; no article data is sent to Mozilla.

## Children's Privacy

Still does not knowingly collect information from anyone, including children under 13.

## Changes to This Policy

If this policy changes, the updated version will be published at this URL with a revised "Last updated" date.

## Contact

Questions about this privacy policy? Contact:

**hello@fmiguelop.dev**
