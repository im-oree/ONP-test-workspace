// Smart loader for the Onion Player UMD SDK.
// Tries each candidate URL in order; resolves as soon as `window.Onion`
// exists. Never throws — returns a status object the UI can react to.

import { SDK_CANDIDATES } from './onp-config.js'

function injectScript(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = url
    s.async = true
    let done = false
    const finish = (ok) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(ok)
    }
    const timer = setTimeout(() => finish(false), timeoutMs)
    s.onload = () => finish(!!window.Onion)
    s.onerror = () => finish(false)
    document.head.appendChild(s)
  })
}

let loadPromise = null

export function loadOnionSDK() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    if (window.Onion) return { ok: true, url: 'preloaded', version: window.Onion.VERSION }
    for (const url of SDK_CANDIDATES) {
      const ok = await injectScript(url)
      if (ok && window.Onion) {
        return { ok: true, url, version: window.Onion.VERSION }
      }
    }
    return { ok: false, url: null, version: null }
  })()
  return loadPromise
}
