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
    const finish = (result) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => finish('timeout'), timeoutMs)
    s.onload = () => finish(window.Onion ? 'ok' : 'loaded-no-global')
    s.onerror = () => finish('error')
    document.head.appendChild(s)
  })
}

let loadPromise = null

export function loadOnionSDK() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const attempts = []
    if (window.Onion) return { ok: true, url: 'preloaded', version: window.Onion.VERSION, attempts }
    for (const url of SDK_CANDIDATES) {
      const result = await injectScript(url)
      attempts.push({ url, result })
      if (result === 'ok' && window.Onion) {
        return { ok: true, url, version: window.Onion.VERSION, attempts }
      }
    }
    return { ok: false, url: null, version: null, attempts }
  })()
  return loadPromise
}
