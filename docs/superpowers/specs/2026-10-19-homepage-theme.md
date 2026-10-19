# BizGuide AI — Paper Arcade theme

Date: 2026-10-19
Status: Theme contract for review before implementation.
Parent design: `2026-10-19-homepage-redesign-design.md`.

## Character

Warm, tactile, confident, and playful. Use the reference's oversized typography and offset geometry to make business planning approachable. Reading and interaction stay familiar. Flat color, useful diagrams, visible outlines, and deliberate whitespace replace the current glows and decorative particles.

## Color tokens

| CSS token | Exact value | Role |
| --- | --- | --- |
| `--mk-paper` | `#F4EBDD` | Main background |
| `--mk-ink` | `#252820` | Text, outlines, connectors, shadows |
| `--mk-orange` | `#D94F30` | Primary actions and active stages |
| `--mk-sage` | `#B9C7A5` | Completed stages and capability surfaces |
| `--mk-yellow` | `#F2CE67` | Notes and selected highlights |
| `--mk-on-orange` | `#10120E` | Accessible small text on orange |

Calculated contrast ratios using sRGB relative luminance:

- Ink on paper: 12.67:1.
- Ink on sage: 8.39:1.
- Ink on yellow: 9.84:1.
- Standard ink on orange: 3.64:1; do not use for normal-size text.
- On-orange ink on orange: 4.58:1; use this token for all orange control labels.

This refines the parent spec's requirement to check contrast while preserving its five main colors. Use ink rather than low-opacity text for supporting copy. Use labels, step numbers, outlines, and completion marks alongside color to communicate state.

## Typography

| Role | Family | Weight | Size / line height |
| --- | --- | --- | --- |
| Hero | Space Grotesk | 700 | `clamp(3rem, 7.5vw, 7.5rem)` / 0.96 |
| Section heading | Space Grotesk | 700 | `clamp(2.25rem, 4.5vw, 4.5rem)` / 1.04 |
| Card heading | Space Grotesk | 700 | `clamp(1.35rem, 2vw, 1.75rem)` / 1.15 |
| Lead paragraph | Space Grotesk | 400 | `clamp(1.125rem, 1.4vw, 1.35rem)` / 1.6 |
| Body | Space Grotesk | 400/500 | 16px / 1.6 |
| Navigation and controls | IBM Plex Mono | 500 | 14px / 1.4 |
| Short label | IBM Plex Mono | 500 | 12px / 1.5 |
| Stage number | IBM Plex Mono | 500 | 16px / 1 |

Use `Arial, sans-serif` and `ui-monospace, monospace` as fallbacks. Load the families only for marketing styling, with font-display swap. Avoid applying marketing typography to the advisor. Uppercase short headings and labels, not explanatory paragraphs.

## Geometry and rhythm

- Page container: `min(1240px, calc(100% - 48px))`; at widths below 640px use `calc(100% - 32px)`.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.
- Section padding: `clamp(64px, 8vw, 112px)` vertically.
- Body reading width: 62 characters; hero description at most 46 characters per line.
- Standard outline: 2px solid ink.
- Standard hard shadow: 6px 6px 0 ink. Compact shadow: 4px 4px 0 ink.
- Standard corner radius: 4px. Maximum radius: 8px. Metadata chips may remain square.
- Controls: minimum 48px high; icon controls at least 44px by 44px.
- Primary button: orange, on-orange ink label, 2px ink border, 5px hard shadow.
- Hover: translate by -2px/-2px and expand shadow by 2px. Press: translate by 4px/4px and reduce shadow to 1px.
- Focus: 3px solid ink outline with a 3px paper separation. Do not remove focus outlines from inputs.
- Avoid random rotation on readable paragraphs or controls. Allow a slight static rotation on decorative paper notes only.

## Component language

- Header: paper surface, ink bottom border, plain ink wordmark, compact orange action.
- Hero: oversized type on paper; one orange headline fragment; sage conversation preview with ink border.
- Input: paper field inside an outlined shell. Keep the submit action distinct and show validation inline.
- Capability blocks: paper, sage, and yellow surfaces with consistent line icons; all content remains visible without hover.
- Process: orthogonal ink connectors, numbered blocks, orange active state, sage completed state, paper future state. Icons and labels share the same visual grammar as capability cards.
- Notes: yellow paper surface, ink pin mark, short self-contained recommendations.
- Example selector: real buttons with visible selected indicators; a labeled editable question controls the advisor destination.
- FAQ: native details/summary with visible open/close affordance.
- Footer: ink surface with paper text; primary footer action stays legible and clearly focusable.

## Motion tokens

- Control response: 140ms ease-out.
- Short reveal: 240ms ease-out.
- Card detail: 360ms ease-out.
- Sample note arrival: 500ms maximum.
- Scroll progress: follows native scrolling; no autoplay or forced snapping.
- Reduced motion: instantaneous state changes and full static vertical process; no transforms or connector scrubbing.
- GSAP owns scroll transitions and connectors; Anime.js owns decorative children. Never share animation targets.

## Theme-first delivery order

1. Create scoped tokens and base component styling.
2. Apply the theme to the header and hero first; visually check type, controls, contrast, and mobile fit.
3. Use those same primitives for the remaining homepage sections.
4. Build the process as readable static content before adding motion.
5. Add GSAP and Anime.js enhancement and verify lifecycle behavior.

## Scope guard

This document defines a theme; it does not change the live page. Implementation will use `.marketing-page` scoped rules in `app/marketing.css`. The shared dark tokens and advisor components remain outside the redesign. Do not install dependencies or modify product files before the implementation-plan review required by the selected Superpowers workflow.
