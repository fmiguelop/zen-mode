# Font decision (FMI-19)

## Decision

Still ships **three reader font choices**:

| Option | Implementation | Default |
|--------|----------------|---------|
| **Inter** | Bundled `InterVariable.ttf` | Yes |
| **Atkinson Hyperlegible** | Bundled Regular + Bold (OFL) | No |
| **System** | `system-ui` stack, no extra bundle | No |

Reader UI chrome (dock, settings popover) stays on **Inter / system UI**. Only the article surface (title, byline, body prose) uses the selected reader font. Code blocks keep a monospace stack.

## Candidates evaluated

### Atkinson Hyperlegible (chosen readable bundle)

- **License:** SIL Open Font License 1.1 — redistributable in Chrome Web Store builds.
- **Bundle:** ~108 KB uncompressed (Regular 53 KB + Bold 54 KB).
- **Fit:** Designed for legibility; pairs with Still’s calm editorial look without the “dyslexia font” stigma of heavier alternatives.
- **Coverage:** Latin; sufficient for v1 store locales (EN/ES).

### OpenDyslexic (not shipped)

- **License:** OFL-compatible variants exist, but visual weight and letterforms clash with Still’s minimal brand.
- **Risk:** Strong “accessibility font” signaling; many readers who benefit from clearer type prefer neutral hyperlegible faces.
- **Bundle:** Additional maintenance for marginal gain over Atkinson for this product.

### System-only (not sufficient alone)

- **Pros:** Zero bundle cost, respects OS typography.
- **Cons:** Loses consistent Still identity; Inter is a core brand choice. Kept as the **third option**, not the only option.

## Rationale summary

1. **Inter default** preserves today’s experience for existing users.
2. **Atkinson** addresses FMI-19 / accessibility project goals with a licensed, bundled readable face.
3. **System** adds expandability and OS-native comfort without more font files.

## Unblocks

- [FMI-25](https://linear.app/fmiguelop/issue/FMI-25) — Add readable font family preference
