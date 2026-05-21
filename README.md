# Still

**Quiet reading for the open web.**

Still is a Chrome extension that strips any web page down to clean, distraction-free article text — one click, no settings, no account.

## How it works

1. Click the **Still** icon in your toolbar
2. The page transforms into a calm reader overlay
3. Press **Esc** or click **Exit Still** to return

Article extraction runs locally in your browser using [Mozilla Readability](https://github.com/mozilla/readability). Nothing is sent to external servers.

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
  background.ts     Toolbar click handler
  content.ts        Reader mode toggle
utils/
  extract-article.ts  Readability wrapper
  reader-overlay.ts   Full-screen reader UI
  toast.ts            Error notifications
assets/
  reader.css          Reader overlay styles
public/
  icon/               Extension icons (16–128px)
  fonts/              Bundled Inter Variable
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

### Icon

The **frame-column** mark: a charcoal rounded square with a narrow cream column in the center. Represents framing the article and stripping everything else.

- Source: `public/icon/still.svg`
- Minimum clear space: 1× column width around the mark
- Do not stretch, rotate, or recolor outside the defined palette

### Typography

**Inter Variable** for all UI and reader text. Bundled locally — no external font requests.

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
