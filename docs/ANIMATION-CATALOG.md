# Animation Catalogue

Every `.onp` in `animations/`, read from each file's `manifest.json`. All are
transparent (alpha) compositions at 60 fps, so they can sit borderless on a page.

| File | Size | Frames | Duration | Required features | Used in the demo |
|------|------|--------|----------|-------------------|------------------|
| `hero-kinetic-type.onp` | 1920×1080 | 600 | 10.0 s | camera, text, vector, packaged-fonts | Hero background (isolated) |
| `logo-heatmap.onp` | 1920×1080 | 600 | 10.0 s | colorama, deepGlow, adjustment, text, vector | **Scroll-scrubbed** showcase |
| `liquid-glass.onp` | 1920×1080 | 177 | 2.95 s | null, text, vector, trim, stroke, image | Feature + works grid |
| `neon-carousel.onp` | 1920×1080 | 324 | 5.4 s | deepGlow, adjustment, null, vector | Works grid |
| `bouncing-ball.onp` | 1920×1080 | 270 | 4.5 s | solid, vector (bounce easing) | Works grid |
| `bounce-badge-square.onp` | 1080×1080 | 90 | 1.5 s | text, vector, packaged-fonts | Works grid |
| `jack-and-jill-type.onp` | 1920×1080 | 600 | 10.0 s | text, packaged-fonts | Works grid |
| `aurelia-monogram.onp` | 1080×1080 | 360 | 6.0 s | null, vector, fill, path, stroke | **Playground** (direct player) |

## Original → renamed

The files arrived with working titles; they were renamed to describe what they
actually are (history preserved via `git mv`).

| Original | Renamed to | Why |
|----------|-----------|-----|
| `New Composition.onp` | `hero-kinetic-type.onp` | 3D camera drifting through outlined kinetic type |
| `logo heamap.onp` | `logo-heatmap.onp` | Colorama + Deep Glow heat-map sweep over a vector mark |
| `liquid glass test.onp` | `liquid-glass.onp` | Trimmed strokes + layered imagery refraction study |
| `carousel thing.onp` | `neon-carousel.onp` | Cards orbiting a 3D null with a Deep Glow adjustment |
| `bouncing ball.onp` | `bouncing-ball.onp` | Classic squash-and-stretch bounce |
| `bounce test stuff with 1-1 layout square.onp` | `bounce-badge-square.onp` | 1:1 badge with staggered bouncing dots |
| `jack and jill text anim short.onp` | `jack-and-jill-type.onp` | Pure packaged-font typography |
| *(new)* | `aurelia-monogram.onp` | **Hand-authored** for this workspace |

## `aurelia-monogram.onp` — the hand-authored file

Built by `tools/`-style scripting against the observed `.onp` schema (see
`ONP-FORMAT-NOTES.md`). It deliberately sticks to the safe, widely-supported
feature set — `layer:vector`, `layer:null`, `vectornode:{path,fill,stroke}` — so
any conforming Onion runtime can play it. No effects, images or fonts required.

Design: two counter-rotating rounded squares, a slowly-rotating halo ring, three
dots orbiting a parented **null**, and a breathing central core. Rotations land on
values that are visually identical to the start (a rounded square at 90°, a full
360° null orbit), so it **loops seamlessly**.
