// Thin wrapper around the Onion SDK that adds graceful poster fallbacks and
// keeps track of the single allowed "direct" player (one per JS realm).
import { ISOLATED_RUNTIME_URL } from './onp-config.js'

let directUsed = false

const abs = (src) => new URL(src, window.location.origin).href

// A tasteful CSS-only poster shown before the animation loads, or as a
// permanent fallback when the SDK/CDN is unreachable (e.g. offline).
export function paintPoster(slot, meta, { reason } = {}) {
  slot.classList.add('onp-poster')
  slot.innerHTML = `
    <div class="poster-inner">
      <div class="poster-orb" aria-hidden="true"></div>
      <div class="poster-meta">
        <span class="poster-title">${meta.title}</span>
        <span class="poster-spec">${meta.w}×${meta.h} · ${meta.fps}fps · ${meta.frames}f</span>
      </div>
    </div>`
  if (reason) slot.setAttribute('data-poster-reason', reason)
}

// Create a render stage layered ON TOP of the existing poster, so the poster
// keeps showing until the real (transparent) animation is ready, then swap.
function makeStage(slot) {
  let stage = slot.querySelector('.onp-stage')
  if (!stage) {
    stage = document.createElement('div')
    stage.className = 'onp-stage'
    slot.appendChild(stage)
  }
  return stage
}

function clearPoster(slot) {
  slot.classList.remove('onp-poster')
  slot.removeAttribute('data-poster-reason')
  slot.querySelector('.poster-inner')?.remove()
}

// Mount the ONE direct player (full OnionPlayer API: setRate/setDirection/
// setBounce/setFitMode/setVariable/events/snapshot). Returns the player or null.
export async function mountDirect(slot, meta, opts = {}) {
  if (!window.Onion) { paintPoster(slot, meta, { reason: 'no-sdk' }); return null }
  if (directUsed) { console.warn('Direct player already used; use mountIsolated'); return null }
  directUsed = true
  const stage = makeStage(slot)
  try {
    const player = await window.Onion.mount(stage, {
      src: meta.src,
      autoplay: opts.autoplay ?? true,
      loop: opts.loop ?? true,
      muted: true,
      onReady: () => clearPoster(slot),
      onError: (e) => { console.error('[onion:direct]', meta.file, e); paintPoster(slot, meta, { reason: 'error' }) },
    })
    if (opts.fitMode) player.setFitMode(opts.fitMode)
    clearPoster(slot)
    return player
  } catch (e) {
    console.error('[onion:direct] mount failed', meta.file, e)
    paintPoster(slot, meta, { reason: 'error' })
    directUsed = false
    return null
  }
}

// Mount an isolated (iframe) player. Returns an IsolatedHandle or null.
// Handles support: play/pause/seekFrame/setState/ready/dispose.
export function mountIsolated(slot, meta, opts = {}) {
  if (!window.Onion) { paintPoster(slot, meta, { reason: 'no-sdk' }); return null }
  const stage = makeStage(slot)
  try {
    const handle = window.Onion.mountIsolated(stage, {
      src: abs(meta.src),
      runtimeUrl: ISOLATED_RUNTIME_URL,
      autoplay: opts.autoplay ?? true,
      loop: opts.loop ?? true,
      muted: true,
      lazy: opts.lazy ?? true,
      rootMargin: opts.rootMargin ?? '300px',
      onError: (e) => { console.error('[onion:iso]', meta.file, e); paintPoster(slot, meta, { reason: 'error' }) },
    })
    // Swap out the poster only once the inner player has actually loaded.
    Promise.resolve(handle?.ready).then(() => clearPoster(slot)).catch(() => {})
    return handle
  } catch (e) {
    console.error('[onion:iso] mount failed', meta.file, e)
    paintPoster(slot, meta, { reason: 'error' })
    return null
  }
}

export function resetDirect() { directUsed = false }
