# Local vendor slot for the Onion runtime (optional)

The page loads the Onion Player SDK from the first working URL in
`src/onp-config.js` → `SDK_CANDIDATES`. The **first** candidate is this folder:

```
/vendor/onp/onp-runtime.umd.js
```

Drop the built `onp-runtime.umd.js` here to make the site run **fully offline**
(and to let a sandboxed headless browser render the animations without any
network access). If the file is absent, the loader automatically falls back to
the public deployment:

```
https://1test-onion.vercel.app/onp-runtime.umd.js
```

Build the runtime from the Onion repo with:

```bash
npx vite build --config vite.onp-runtime.config.ts   # → dist-onp/onp-runtime.umd.js
```
