// ---------------------------------------------------------------------------
// Onion runtime + animation catalogue configuration.
//
// The Onion Player SDK is loaded from a list of candidate URLs, tried in
// order until one defines `window.Onion`. A vendored local copy (if present)
// wins so the page also works fully offline; otherwise we fall back to the
// public Onion CDN deployment.
// ---------------------------------------------------------------------------

export const SDK_CANDIDATES = [
  // 1) Local vendored copy (drop onp-runtime.umd.js here to run offline).
  '/vendor/onp/onp-runtime.umd.js',
  // 2) The public Onion deployment that publishes the runtime.
  'https://1test-onion.vercel.app/onp-runtime.umd.js',
  'https://1test-onion.vercel.app/embed.js',
]

// Where isolated iframes should load the runtime from. Must be a URL the
// iframe realm can reach (i.e. an absolute, public URL — not the local path).
export const ISOLATED_RUNTIME_URL = 'https://1test-onion.vercel.app/onp-runtime.umd.js'

const A = (file) => `/animations/${file}`

// Catalogue metadata mirrors each file's manifest.json (width/height/fps/
// durationFrames) so we can size embeds and map scroll → frame precisely.
export const ANIMATIONS = {
  // The original hero-kinetic-type package requires the camera feature and
  // logo-heatmap requires Colorama. Runtime 25 advertises those packages as
  // loadable but stalls before its first-frame callback. Use equivalent files
  // from the catalogue's proven portable feature profile for these two
  // above-the-fold/interactive placements.
  hero: {
    src: A('jack-and-jill-type.onp'),
    title: 'Kinetic Type',
    file: 'jack-and-jill-type.onp',
    w: 1920, h: 1080, fps: 60, frames: 600, transparent: true,
    features: ['text', 'packaged-fonts'],
    note: 'Packaged-font kinetic typography.',
  },
  heatmap: {
    src: A('neon-carousel.onp'),
    title: 'Neon Scroll Study',
    file: 'neon-carousel.onp',
    w: 1920, h: 1080, fps: 60, frames: 324, transparent: true,
    features: ['deepGlow', 'null', 'adjustment', 'vector'],
    note: 'A glowing vector carousel — scrubbed by scroll.',
  },
  liquid: {
    src: A('liquid-glass.onp'),
    title: 'Liquid Glass',
    file: 'liquid-glass.onp',
    w: 1920, h: 1080, fps: 60, frames: 177, transparent: true,
    features: ['image', 'text', 'vector', 'stroke', 'trim'],
    note: 'Refraction study with trimmed strokes over layered imagery.',
  },
  carousel: {
    src: A('neon-carousel.onp'),
    title: 'Neon Carousel',
    file: 'neon-carousel.onp',
    w: 1920, h: 1080, fps: 60, frames: 324, transparent: true,
    features: ['deepGlow', 'null', 'adjustment', 'vector'],
    note: 'Cards orbiting a 3D null with a Deep Glow adjustment on top.',
  },
  ball: {
    src: A('bouncing-ball.onp'),
    title: 'Bouncing Ball',
    file: 'bouncing-ball.onp',
    w: 1920, h: 1080, fps: 60, frames: 270, transparent: true,
    features: ['solid', 'vector', 'bounce-easing'],
    note: 'A classic squash-and-stretch bounce with penner easing.',
  },
  badge: {
    src: A('bounce-badge-square.onp'),
    title: 'Bounce Badge',
    file: 'bounce-badge-square.onp',
    w: 1080, h: 1080, fps: 60, frames: 90, transparent: true,
    features: ['text', 'vector', 'packaged-fonts'],
    note: 'Square 1:1 badge with staggered bouncing dots.',
  },
  jackjill: {
    src: A('jack-and-jill-type.onp'),
    title: 'Jack & Jill',
    file: 'jack-and-jill-type.onp',
    w: 1920, h: 1080, fps: 60, frames: 600, transparent: true,
    features: ['text', 'packaged-fonts'],
    note: 'Pure packaged-font typography animation.',
  },
  monogram: {
    src: A('aurelia-monogram.onp'),
    title: 'Aurelia Monogram',
    file: 'aurelia-monogram.onp',
    w: 1080, h: 1080, fps: 60, frames: 360, transparent: true,
    features: ['null', 'vector', 'fill', 'stroke'],
    note: 'Hand-authored for this workspace — counter-rotating squares, orbiting dots, a breathing core. Seamless loop.',
  },
}
