---
name: tailwind-refactor
description: Pass B — refactors an already pixel-locked screen from inline styles to Tailwind v4 utilities, behind the pixel-QA gate, with zero visual regression.
---

# tailwind-refactor

## Mission
Convert inline styles to Tailwind without changing a single pixel.

## Method (Pass B)
1. Start only from a screen that passed Pixel-QA (Pass A) — that baseline is the contract.
2. Replace layout/spacing/typography inline styles with Tailwind utilities.
3. Keep brand/theme values as `var(--…)` via arbitrary values
   (`bg-[var(--header-grad)]`, `shadow-[var(--glow-green)]`, `rounded-[var(--radius)]`,
   `w-[248px]`). Never hardcode a hex that a theme would otherwise change.
4. Re-run `pixel-qa` and diff against the Pass-A baseline — must be zero regression.

## Hard rules
- Tailwind is v4 (CSS-first); tokens live in `app/globals.css` `@theme`.
- If a value can't be expressed faithfully, keep the inline style — fidelity beats purity.

## Done when
Pixel-QA (Pass B) shows zero diff vs the Pass-A baseline in all 3 themes.
