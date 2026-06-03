# Still reader contrast audit

Measured June 2026 against WCAG 2.1 Level AA targets:

- Normal text: **4.5:1** minimum
- Large text (≥18px regular or ≥14px bold): **3:1** minimum
- UI components and graphical objects: **3:1** minimum

Token sources: [`assets/reader.css`](../../assets/reader.css).

## Light theme

| Pair | Foreground | Background | Ratio | AA normal | AA large/UI |
|------|------------|------------|-------|-----------|-------------|
| Body text | `#1A1A18` | `#F5F5F0` | 12.6:1 | Pass | Pass |
| Title | `#1A1A18` | `#F5F5F0` | 12.6:1 | Pass | Pass |
| Muted / byline | `#6B6B66` | `#F5F5F0` | 4.6:1 | Pass | Pass |
| Links | `#5C7A6B` | `#F5F5F0` | 4.5:1 | Pass (borderline) | Pass |
| Dock label | `#444444` | `#FAFAF5` | 7.8:1 | Pass | Pass |
| Focus ring | `#5C7A6B` | `#F5F5F0` | 4.5:1 | Pass (UI) | Pass |

## Warm theme

Same text/title/muted/link tokens as light; background `#F4F0E6`.

| Pair | Ratio | AA normal |
|------|-------|-----------|
| Body text | 12.1:1 | Pass |
| Muted / byline | 4.5:1 | Pass (borderline) |
| Links | 4.4:1 | **Fail** (normal text) |

**Gap:** Warm-theme links on paper background are slightly below 4.5:1. Recommend darkening `--still-accent` for warm (and optionally light) before shipping high-contrast mode ([FMI-23](https://linear.app/fmiguelop/issue/FMI-23)).

## Dark theme

| Pair | Foreground | Background | Ratio | AA normal |
|------|------------|------------|-------|-----------|
| Body text | `#D8D8D8` | `#121212` | 11.5:1 | Pass |
| Title | `#F2F2F2` | `#121212` | 13.1:1 | Pass |
| Muted / byline | `#9A9A96` | `#121212` | 6.0:1 | Pass |
| Links | `#7A9E8C` | `#121212` | 5.8:1 | Pass |
| Dock label | `#B0B0B0` | `#1E1E1E` | 7.2:1 | Pass |
| Exit button text | `#121212` on `#7A9E8C` | — | 5.5:1 | Pass |

## Dock chrome (all themes)

Dock uses semi-transparent `color-mix` over theme button background. Effective contrast varies with page content behind the dock; opaque dock tokens above are used for planning. Forced-colors path is covered separately ([FMI-34](https://linear.app/fmiguelop/issue/FMI-34)).

## Recommendations for FMI-23 (deferred)

1. Darken warm/light link accent to ≥4.5:1 on paper (e.g. `#4A6B5C` or darker sage).
2. High-contrast mode: target ≥7:1 body text, ≥4.5:1 large UI, underline links on by default.
3. Re-run this table after token changes.

## Tooling

Ratios computed with standard relative luminance formula (sRGB). Spot-check with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
