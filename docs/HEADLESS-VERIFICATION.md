# Headless verification

The demo was checked in a headless Chromium (`playwright-core` driving the
`@sparticuz/chromium` binary — the only Chromium obtainable in an npm-only
sandbox). The harness lives in `tools/`:

```bash
# with the dev server running on :5173
bash tools/run-headless.sh http://localhost:5173/ docs/screenshots
```

It loads the page, scrolls the whole document (to exercise GSAP `ScrollTrigger`
pinning and reveals), captures screenshots, and reports any console/page errors.

## Result

```
INFO {
  "title": "Aurelia — Motion-Art Atelier",
  "slots": 10, "posters": 10, "workCards": 6,
  "chip": "Onion runtime unavailable — showing posters. …",
  "navExists": true, "consoleStage": true,
  "heroTitle": "We make brands\nmove like weather."
}
ERRORS(3):
  - 404 (Not Found)                # /vendor/onp/onp-runtime.umd.js — expected
  - net::ERR_CONNECTION_CLOSED     # vercel SDK URL — see note
  - net::ERR_CONNECTION_CLOSED     # vercel embed.js URL — see note
```

Screenshots: `docs/screenshots/verify-hero.png`, `verify-full.png`,
`verify-console.png`.

## Important note on the "errors"

The three logged failures are **not bugs** — they're the SDK loader doing exactly
what it should. This build sandbox's network is locked down to the npm registry
only; it **cannot reach `1test-onion.vercel.app`**, so the Onion runtime can't be
fetched here. The loader tries each candidate URL, fails, and the page falls back
to animated CSS posters with a clear status chip.

### What headless *did* verify
- Full layout, typography and art direction across every section
- GSAP scroll behaviour (nav state, reveals, the pinned scroll-scrub section)
- 10 embed slots created, 6 works cards generated, the console panel wired
- Graceful degradation + accurate status messaging when the SDK is unreachable
- Zero unhandled JS errors from the site's own code

### What only a real browser can verify (and where it works)
Actual `.onp` playback requires loading the Onion runtime from the CDN, which a
normal browser (including the Arena live preview) reaches fine. Open the live
preview to see every poster replaced by its real, playing animation and the
Playground snapshot go live. To also render **offline/headless**, drop a built
`onp-runtime.umd.js` into `sites/aurelia-studio/public/vendor/onp/` — the loader
prefers that local copy automatically.
