// Thin wrapper around the Onion SDK that adds graceful poster fallbacks and
// keeps track of the single allowed "direct" player (one per JS realm).
import { ISOLATED_RUNTIME_URL } from './onp-config.js'

let directUsed = false
let isolatedRuntimeUrl = ISOLATED_RUNTIME_URL

// Isolated players run in another realm and must load the same SDK candidate
// that actually succeeded in the parent. Keeping the configured URL as a
// fallback preserves backwards compatibility for preloaded SDKs.
export function setIsolatedRuntimeUrl(url) {
  if (url && url !== 'preloaded') isolatedRuntimeUrl = new URL(url, window.location.href).href
}

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

// Mount a player in a dedicated iframe realm. We intentionally own the small
// iframe bridge instead of calling SDK mountIsolated: SDK 25 can leave its
// ready promise pending forever when embedded through a proxied preview host.
// A direct mount in each iframe preserves the renderer's one-player-per-realm
// requirement and gives us explicit ready/error messages.
export function mountIsolated(slot, meta, opts = {}) {
  if (!window.Onion) { paintPoster(slot, meta, { reason: 'no-sdk' }); return null }
  const stage = makeStage(slot)
  const id = `onp-${crypto.randomUUID()}`
  let frame = null
  let observer = null
  let disposed = false
  let resolveReady
  let rejectReady
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject })
  // Callers attach a rejection handler later; keep failures from becoming an
  // unhandled rejection in the meantime.
  ready.catch(() => {})

  const send = (method, value) => frame?.contentWindow?.postMessage({ type: 'aurelia-onp-command', id, method, value }, '*')
  const onMessage = (event) => {
    if (event.source !== frame?.contentWindow || event.data?.id !== id) return
    if (event.data.type === 'aurelia-onp-ready') {
      clearPoster(slot)
      resolveReady()
    } else if (event.data.type === 'aurelia-onp-error') {
      const error = new Error(event.data.message || 'Isolated ONP player failed')
      console.error('[onion:iso]', meta.file, error)
      paintPoster(slot, meta, { reason: 'error' })
      rejectReady(error)
    }
  }
  window.addEventListener('message', onMessage)

  const createFrame = () => {
    if (disposed || frame) return
    frame = document.createElement('iframe')
    frame.title = `${meta.title} animation`
    frame.setAttribute('allow', 'autoplay')
    const config = JSON.stringify({
      id,
      runtimeUrl: isolatedRuntimeUrl,
      src: abs(meta.src),
      autoplay: opts.autoplay ?? true,
      loop: opts.loop ?? true,
    }).replaceAll('<', '\\u003c')
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body,#stage{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}canvas{width:100%!important;height:100%!important;display:block}</style></head><body><div id="stage"></div><script>(()=>{const config=${config};let bridgePlayer;const report=(type,message)=>parent.postMessage({type,id:config.id,message},'*');addEventListener('message',e=>{const d=e.data;if(d?.type!=='aurelia-onp-command'||d.id!==config.id||!bridgePlayer)return;try{if(d.method==='seekFrame')bridgePlayer.seekFrame(d.value);else if(d.method==='setState')bridgePlayer.setState(d.value);else bridgePlayer[d.method]?.()}catch(error){report('aurelia-onp-error',String(error?.message||error))}});const script=document.createElement('script');script.src=config.runtimeUrl;script.onload=async()=>{try{if(!window.Onion)throw new Error('Runtime loaded without window.Onion');bridgePlayer=await window.Onion.mount('#stage',{src:config.src,autoplay:config.autoplay,loop:config.loop,muted:true,onReady:()=>report('aurelia-onp-ready')});report('aurelia-onp-ready')}catch(error){report('aurelia-onp-error',String(error?.message||error))}};script.onerror=()=>report('aurelia-onp-error','Runtime script failed to load');document.head.appendChild(script)})();<\/script></body></html>`
    stage.appendChild(frame)
  }

  if (opts.lazy ?? true) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect()
        observer = null
        createFrame()
      }
    }, { rootMargin: opts.rootMargin ?? '300px' })
    observer.observe(stage)
  } else {
    createFrame()
  }

  return {
    get frame() { return frame },
    ready,
    play: () => send('play'),
    pause: () => send('pause'),
    seekFrame: (value) => send('seekFrame', value),
    setState: (value) => send('setState', value),
    dispose: () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('message', onMessage)
      frame?.remove()
      frame = null
    },
  }
}

export function resetDirect() { directUsed = false }
