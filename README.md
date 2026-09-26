# ONP Test Workspace

A workspace for testing **Onion** `.onp` embeddable animations — the packaged,
portable animation format exported by [Onion](https://1test-onion.vercel.app/).

This repo holds the animation library, the format documentation, and a full
demo site that embeds the files end-to-end.

```
ONP-test-workspace/
├── animations/                 # The canonical .onp library (renamed, tidy)
│   ├── hero-kinetic-type.onp
│   ├── logo-heatmap.onp
│   ├── liquid-glass.onp
│   ├── neon-carousel.onp
│   ├── bouncing-ball.onp
│   ├── bounce-badge-square.onp
│   ├── jack-and-jill-type.onp
│   └── aurelia-monogram.onp     # ← hand-authored in this workspace
├── docs/
│   ├── ONP-EMBED-GUIDE.md       # The official embedding / SDK reference
│   ├── ANIMATION-CATALOG.md     # Every .onp: size / fps / frames / features
│   ├── ONP-FORMAT-NOTES.md      # What the .onp container actually contains
│   ├── HEADLESS-VERIFICATION.md # How the demo was verified + screenshots
│   └── screenshots/
├── sites/
│   └── aurelia-studio/          # The demo: a motion-art studio landing page
└── tools/                       # Headless-browser verification harness
```

## The demo — `sites/aurelia-studio`

**Aurelia** is a fictional *motion-art atelier*. Its landing page is a live test
harness: **every visual is a real `.onp` played by the Onion runtime**, exercising
the SDK in several different ways.

| Section | File | How it's embedded |
|---------|------|-------------------|
| Hero background | `hero-kinetic-type.onp` | `mountIsolated` (eager, full-bleed) |
| Scroll showcase | `logo-heatmap.onp` | `mountIsolated` + **GSAP ScrollTrigger scrub → `seekFrame`** |
| Liquid-glass feature | `liquid-glass.onp` | `mountIsolated` (autoplay loop) |
| Works grid (×6) | carousel, monogram, jack&jill, ball, badge, liquid | `mountIsolated` (lazy, on-scroll) |
| Console / playground | `aurelia-monogram.onp` | `Onion.mount` (the single **direct** player) with the full control surface |

Techniques on show: the plain UMD embed, **isolated iframes** for many players on
one page, **lazy loading**, **scroll-driven frame playback** (GSAP), and the full
`OnionPlayer` API (transport, speed, direction, bounce, fit-mode, runtime variable
overrides, live snapshot).

### Run it

```bash
cd sites/aurelia-studio
npm install
npm run dev          # → http://localhost:5173
```

The Onion runtime SDK is loaded in the browser from the first working URL in
`src/onp-config.js`:

1. `/vendor/onp/onp-runtime.umd.js` — a local copy, if you drop one in (works offline)
2. `https://1test-onion.vercel.app/onp-runtime.umd.js` — the public deployment

If neither is reachable the page degrades gracefully to animated CSS posters and a
status chip explains why. See `docs/HEADLESS-VERIFICATION.md` for details on how
this behaves inside a network-restricted sandbox vs. a real browser.
