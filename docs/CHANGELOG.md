# Changelog

All notable changes to Still are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## 0.3.1 — June 2026

### Improved
- **Privacy-first page access** — Still only reads the page you are on after you click the extension or use the keyboard shortcut. It no longer asks for access to every site up front.
- **Reader script on demand** — the reader loads into the active tab when you activate Still, not in the background on pages you have not opened.
- **Bundled fonts** — Inter and Atkinson Hyperlegible still load locally from inside the extension.

## 0.3.0 — June 2026

### Added
- **Enter fullscreen when Still opens** — optional setting that puts Chrome in fullscreen when you start reading; restores your previous window state when you exit Still.
- **Reader font choice** — Inter (default), Atkinson Hyperlegible, or your system font for article text.
- **System appearance** — theme and high contrast can follow your device settings (light/dark and increased contrast).

### Improved
- View transitions when entering and exiting reader mode (respects reduced-motion preference).
- In-reader settings popover layout and legibility; options page grouped under Reading.
- Article images centered in the reader column.

## 0.2.0 — June 2026

### Added
- Reading preferences in Options and the in-reader dock: theme (light, warm, dark, system), text size, column width, line height, high contrast, underline links, hide images, reduce motion, and keep dock visible.
- English and Spanish UI; assistive-tech support (skip link, focus trap in settings, progress announcements).
- Scroll position restored when you re-open Still on the same page in the same session.

### Improved
- Reader overlay hardened on hostile sites; double-scrollbar issues reduced.
- Table layout and wrapping in long articles.

## 0.1.1 — May 2026

### Added
- Privacy policy and local-only article extraction documented for the Chrome Web Store.
- HTML sanitization and tests for extracted article content.

### Improved
- Reader typography and column sizing.
- Still branding (renamed from Zen Mode); toolbar and reader chrome polish.

## Earlier releases

Initial reader-mode extension: one-click distraction-free reading with warm paper styling and Mozilla Readability extraction. No account, no tracking.
