# Chrome Web Store listing — Still

Copy-paste fields for the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole). Written for in-store search (reader mode, distraction-free reading) and post-click conversion. Avoids promotional claims flagged by CWS policy (“Free”, “Best”, “#1”, etc.).

---

## Listing fields

### Extension name (45 char max)

```
Still — Reader Mode for Articles
```

33 characters. Primary keywords: **reader mode**, **articles**.

**Alternates** (if the em dash is rejected or you want a second keyword):

| Option | Chars |
|---|---|
| `Still: Distraction-Free Reader Mode` | 35 |
| `Still – Article Reader Mode` | 27 |

---

### Short description (132 char max)

```
Reader mode for articles: one click strips ads and clutter. Local extraction—no account, no tracking, everything stays on your device.
```

122 characters. This is what users see in search results after the title — lead with the main search phrase.

---

### Detailed description

```
Still turns any web page into calm, distraction-free reading. One click on the toolbar icon (or Alt+Shift+S) removes ads, sidebars, pop-ups, and navigation chrome — leaving just the article on warm paper.

Built for news, blogs, essays, and long-form posts. Article extraction runs locally in your browser using Mozilla Readability. Nothing is sent to Still-operated servers. No account. No analytics. No setup.

HOW IT WORKS
• Click the Still icon in your toolbar — or press Alt+Shift+S (Option+Shift+S on Mac)
• The page transforms into a full-screen reader overlay
• Press Esc or click Exit Still to return to the original page

READING FEATURES
• Bundled Inter and Atkinson Hyperlegible fonts, or your system font — no external font requests
• Light, dark, warm, or system-matched reader themes
• Adjustable text size (+ / −), column width, and line height
• High contrast, underline links, hide images, reduce motion, and keep the dock visible
• Optional fullscreen when Still opens
• English and Spanish interface
• Reading time estimate and scroll progress in the header
• View original link to open the source page
• Scroll position restored when you re-open Still on the same page in the same session

PRIVACY
• Article extraction happens entirely on your device
• Still does not collect browsing history or store article text after you exit
• Still only reads the current page after you click the toolbar icon or use the keyboard shortcut — it does not access pages in the background
• Optional reading preferences are saved locally and may sync through Chrome if you use browser sync
• Full privacy policy: https://still.fmiguelop.dev/privacy

WORKS BEST ON
Pages with a clear article body — news sites, blogs, magazines, and essays. Still cannot extract content from chrome:// pages, the Chrome Web Store, PDFs, or pages without readable main content.

Quiet reading for the open web.
```

---

### Category

**Productivity**

---

### Language

**English** (add localized listings later if you ship translations)

---

### URLs

| Field | Value |
|---|---|
| Homepage | `https://still.fmiguelop.dev` |
| Privacy policy | `https://still.fmiguelop.dev/privacy` |
| Support email | `hello@fmiguelop.dev` |

Host `docs/PRIVACY.md` at the privacy URL before submission (see README checklist).

---

## SEO notes

### Target keywords

Prioritize terms people actually search in the Web Store:

| Priority | Keyword / phrase | Where to use |
|---|---|---|
| Primary | reader mode | Title, short description, first paragraph |
| Primary | distraction-free reading | Short description, detailed description |
| Secondary | article reader | Title alternate, detailed description |
| Secondary | read mode / reading mode | Detailed description (natural use) |
| Long-tail | remove ads from articles | Feature bullets |
| Long-tail | clean reading / quiet reading | Tagline, closing line |

### What moves ranking (beyond copy)

- **Install vs. uninstall rate** — keep permissions minimal (`activeTab`, `scripting`, `storage` only); explain active-tab access clearly in review notes if asked
- **Ratings and reviews** — prompt satisfied users after a few successful reads
- **Screenshots** — biggest lever for converting search clicks into installs
- **Recency** — ship updates periodically
- **Manifest V3** — required; MV2 listings show deprecated badges and convert poorly

### Red Nickel — words to avoid

Do not use in title, short description, detailed description, or screenshot captions:

- Free / Free forever / Free to use
- Best / Top / #1 / Top-rated / Award-winning
- Discount / Sale / Limited time

Use functional language instead: “No account”, “Local extraction”, “No tracking”, “One click”.

---

## Screenshots (1280×800)

Provide **3–5** screenshots. At least one is required; five is better for conversion. Use **1280×800** PNG or JPEG. Show real UI — no mockups with promotional adjectives in overlay text.

### Recommended shots

| # | Filename (suggested) | What to show |
|---|---|---|
| 1 | `01-before-after.png` | Split or side-by-side: cluttered article page → same page in Still reader |
| 2 | `02-reader-focus.png` | Full reader overlay — headline, byline, body text, progress bar |
| 3 | `03-toolbar.png` | Normal article page with Still icon visible in the toolbar |
| 4 | `04-themes.png` | Light / dark / warm theme comparison (optional) |
| 5 | `05-options.png` | Options page showing theme, text size, column width (optional) |

### Capture tips

1. Use a **public-domain or permissive article** (e.g. [Project Gutenberg](https://www.gutenberg.org/)) so store imagery is safe to publish.
2. Capture at **1280×800** — Chrome full window or a fixed viewport in DevTools.
3. Use **light theme** for the hero reader shot; it reads best at thumbnail size.
4. Keep screenshot text **functional** (“Reader mode”, “One click”, “Local extraction”) — not promotional.
5. Crop tight on the reader UI for shot 2; users should instantly understand the product.

### Dev workflow

Load unpacked from `.output/chrome-mv3` after `npm run build`. Toggle Still on the test article, screenshot each state, save to a local folder (e.g. `docs/store-assets/source/`) before upload.

The marketing site can sync finalized PNGs from that folder — see `still-marketing-site/public/screenshots/README.md`.

---

## Promotional images (optional)

| Asset | Size | Notes |
|---|---|---|
| Small promo tile | 440×280 | Simple mark + “Reader mode for articles” — functional, not promotional |
| Marquee promo tile | 1400×560 | Only used if featured; same visual language as screenshots |

---

## Pre-submit checklist

- [ ] Title and short description pasted; character counts verified
- [ ] Detailed description pasted; no Red Nickel trigger words
- [ ] Category set to **Productivity**
- [ ] Homepage and privacy policy URLs live and match listing claims
- [ ] Support email set to `hello@fmiguelop.dev`
- [ ] 3–5 screenshots uploaded at 1280×800
- [ ] `npm run zip` package uploaded
- [ ] Privacy policy email placeholder replaced in `docs/PRIVACY.md` (already `hello@fmiguelop.dev`)
- [ ] Test install from review build on a news article and a blog post

---

## Single-purpose statement (for review notes, if asked)

Still is a reader-mode extension. When the user clicks the toolbar icon or keyboard shortcut, it injects a reader script into the current tab, extracts the main article locally, and displays it in a full-screen overlay. Still does not request broad all-site host access and does not modify pages unless explicitly activated by the user.

---

## 0.3.1 review notes

Paste this in the Chrome Web Store submission notes when uploading the `0.3.1` package:

```
This release removes broad site access; Still now reads the active page only after the user clicks the extension or uses the shortcut.
```
