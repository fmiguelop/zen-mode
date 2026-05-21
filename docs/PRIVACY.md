# Privacy Policy — Still

**Last updated:** May 21, 2026
Still ("the Extension") is a browser extension that provides a distraction-free reader mode for web articles. This policy explains what data the Extension accesses and how it is handled.

## Summary

Still does **not** collect, store, or transmit any personal data. All article extraction happens locally in your browser.

## Data Collection

Still does **not**:

- Collect personal information
- Track browsing history
- Store article content
- Send data to external servers
- Use analytics or telemetry
- Require an account or login

## Data Processing

When you click the Still toolbar icon, the Extension:

1. Reads the DOM (HTML structure) of the **current tab only**
2. Extracts the main article content using Mozilla Readability, running entirely on your device
3. Displays the extracted content in a local overlay within the same tab
This processing is ephemeral. Extracted content exists only in memory for the duration of the reading session and is discarded when you exit Still or close the tab. Nothing is written to disk or synced anywhere.

## Permissions

Still requests the following browser permissions:

| Permission | Why |
|---|---|
| `activeTab` | Access the current tab only when you click the toolbar icon |
| `scripting` | Inject the content script on first use if not already loaded |
| `<all_urls>` (host access) | Read page content on whichever site you choose to use Still on |
Still does not access tabs you have not explicitly activated by clicking the icon. It does not run in the background on pages you haven't interacted with.

## Third-Party Services

Still does not integrate with any third-party services, APIs, or external data processors.

## Children's Privacy

Still does not knowingly collect information from anyone, including children under 13.

## Changes to This Policy

If this policy changes, the updated version will be published at this URL with a revised "Last updated" date.

## Contact

Questions about this privacy policy? Contact:
**<hello@fmiguelop.dev>**
Replace the placeholder above before publishing to the Chrome Web Store.
