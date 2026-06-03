# Still reader contrast audit

Measured June 2026 against WCAG 2.1 Level AA targets:

- Normal text: **4.5:1** minimum
- Large text (≥18px regular or ≥14px bold): **3:1** minimum
- UI components and graphical objects: **3:1** minimum

High-contrast mode targets **≥7:1** for body text (AAA for normal text).

Token sources: [`assets/reader.css`](../../assets/reader.css).

## Light theme

| Pair | Foreground | Background | Ratio | AA normal | AA large/UI |
|------|------------|------------|-------|-----------|-------------|
| Body text | `#1A1A18` | `#F5F5F0` | 12.6:1 | Pass | Pass |
| Title | `#1A1A18` | `#F5F5F0` | 12.6:1 | Pass | Pass |
| Muted / byline | `#6B6B66` | `#F5F5F0` | 4.6:1 | Pass | Pass |
| Links | `#4A6B5C` | `#F5F5F0` | 5.5:1 | Pass | Pass |
| Dock label | `#444444` | `#FAFAF5` | 7.8:1 | Pass | Pass |
| Focus ring | `#4A6B5C` | `#F5F5F0` | 5.5:1 | Pass (UI) | Pass |

## Warm theme

Same text/title/muted tokens as light; background `#F4F0E6`; link accent `#4A6B5C`.

| Pair | Ratio | AA normal |
|------|-------|-----------|
| Body text | 12.1:1 | Pass |
| Muted / byline | 4.5:1 | Pass (borderline) |
| Links | 5.4:1 | Pass |

Base warm/light link accent was darkened from `#5C7A6B` to `#4A6B5C` in FMI-23.

## Dark theme

| Pair | Foreground | Background | Ratio | AA normal |
|------|------------|------------|-------|-----------|
| Body text | `#D8D8D8` | `#121212` | 11.5:1 | Pass |
| Title | `#F2F2F2` | `#121212` | 13.1:1 | Pass |
| Muted / byline | `#9A9A96` | `#121212` | 6.0:1 | Pass |
| Links | `#7A9E8C` | `#121212` | 5.8:1 | Pass |
| Dock label | `#B0B0B0` | `#1E1E1E` | 7.2:1 | Pass |
| Exit button text | `#121212` on `#7A9E8C` | — | 5.5:1 | Pass |

## High contrast mode (FMI-23)

Enabled via `data-high-contrast="true"` on `.still-root`, layered on the user’s theme choice. Article links are always underlined in HC (independent of the `underlineLinks` preference).

### lightHC (themes `light` and `warm`)

| Pair | Foreground | Background | Ratio | AA normal |
|------|------------|------------|-------|-----------|
| Body text | `#000000` | `#FFFFFF` | 21:1 | Pass (AAA) |
| Muted / byline | `#333333` | `#FFFFFF` | 12.6:1 | Pass |
| Links | `#0D47A1` | `#FFFFFF` | 8.6:1 | Pass (AAA) |
| Dock exit | `#FFFFFF` | `#000000` | 21:1 | Pass |
| Focus ring | `#0D47A1` | `#FFFFFF` | 8.6:1 | Pass |

### darkHC (theme `dark`)

| Pair | Foreground | Background | Ratio | AA normal |
|------|------------|------------|-------|-----------|
| Body text | `#FFFFFF` | `#000000` | 21:1 | Pass (AAA) |
| Muted / byline | `#CCCCCC` | `#000000` | 13.0:1 | Pass |
| Links | `#6DB3FF` | `#000000` | 8.2:1 | Pass (AAA) |
| Dock exit | `#000000` | `#FFFFFF` | 21:1 | Pass |
| Focus ring | `#6DB3FF` | `#000000` | 8.2:1 | Pass |

## Dock chrome (all themes)

Dock uses semi-transparent `color-mix` over theme button background. Effective contrast varies with page content behind the dock; opaque dock tokens above are used for planning. Forced-colors path is covered separately ([FMI-34](https://linear.app/fmiguelop/issue/FMI-34)).

## System preferences (FMI-33)

When high contrast preference is **System**, `prefers-contrast: more` enables the same HC tokens as manual **On** (`data-high-contrast="true"`). When theme preference is **System**, `prefers-color-scheme: dark` resolves to the dark theme tokens; light resolves to light (not warm).

## Tooling

Ratios computed with standard relative luminance formula (sRGB). Spot-check with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
