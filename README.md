# Still

**Quiet reading for the open web.**

Still is a Chrome extension that strips any web page down to clean, distraction-free article text — one click, no account, no setup.

## How it works

1. Click the **Still** icon in your toolbar (or press **Alt+Shift+S** / **Option+Shift+S** on Mac)
2. The page transforms into a calm reader overlay
3. Press **Esc** or click **Exit Still** to return

While reading: **+** / **−** adjust text size; a progress bar and estimated reading time appear in the header; **View original** opens the source page.

Optional preferences (light/dark/warm theme, text size, column width) live in **Options** — right-click the extension icon → Options, or open from `chrome://extensions`.

Article extraction runs locally in your browser using [Mozilla Readability](https://github.com/mozilla/readability). Nothing is sent to external servers.

## Languages

Extension UI (toolbar, reader overlay, options) follows your **browser UI language**. Supported locales: **English** (`en`) and **Spanish** (`es`). Translations live in `public/_locales/`. Chrome Web Store listing copy is localized separately in the developer dashboard.

## Development

Requires Node.js 18+.

```bash
npm install
npm run dev        # Chrome, hot reload
npm run dev:firefox
npm run build      # Production build → .output/
npm run zip        # Package for store submission
```

Load unpacked in Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `.output/chrome-mv3`.

## Project structure

```
entrypoints/
  background.ts     Toolbar click + keyboard shortcut
  content.ts        Reader mode toggle
  options.html      Extension options (reading prefs)
utils/
  extract-article.ts       Readability wrapper
  preferences.ts           Reading prefs (sync)
  sanitize-article-html.ts Strip inline styles from extracted HTML
  reading-time.ts          Reading time estimate
  scroll-restore.ts        Session scroll restore per URL
  options-page.ts          Options page logic
  i18n.ts                  browser.i18n message helper
  reader-overlay.ts        Full-screen reader UI
  toast.ts                 Error notifications
assets/
  reader.css          Reader overlay styles
public/
  icon/               Extension icons (16–128px)
  fonts/              Inter Variable + Atkinson Hyperlegible (OFL)
docs/
  store-listing.md    Chrome Web Store copy
  PRIVACY.md          Privacy policy
  brand/              Brand kit assets
```

## Brand guidelines

### Colors

| Token | Hex | Use |
|---|---|---|
| Paper | `#F5F5F0` | Reader background |
| Ink | `#1A1A18` | Primary text, icon fill |
| Muted | `#6B6B66` | Byline, footer hint |
| Border | `#E0E0DB` | Dividers |
| Sage | `#5C7A6B` | Links, focus ring |
| Stone | `#8A8478` | Secondary accent |

**Reader themes** (Options): Light (default), Dark (`#121212` / `#D8D8D8`), Warm (`#F4F0E6`). Text size and column width presets available.

### Icon

The **frame-column** mark: a charcoal rounded square with a narrow cream column in the center. Represents framing the article and stripping everything else.

- Source: `public/icon/still.svg`
- Minimum clear space: 1× column width around the mark
- Do not stretch, rotate, or recolor outside the defined palette

### Typography

**Reader font** (Options + reader dock): **Inter** (default), **Atkinson Hyperlegible**, or **System**. UI chrome uses Inter; article text uses the selected font. All bundled fonts ship locally — no external font requests.

## Chrome Web Store publish checklist

- [ ] Run `npm run build` and verify output
- [ ] Replace `[YOUR_EMAIL@example.com]` in `docs/PRIVACY.md`
- [ ] Host privacy policy at a public URL
- [ ] Capture 3 screenshots at 1280×800 (see `docs/store-listing.md`)
- [ ] Run `npm run zip` for upload package
- [ ] Paste listing copy from `docs/store-listing.md`
- [ ] Set category to **Productivity**
- [ ] Submit for review

## License

Private — not published to npm.
