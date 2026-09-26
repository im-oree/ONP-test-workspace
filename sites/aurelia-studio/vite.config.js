import { defineConfig } from 'vite'

// Aurelia Studio dev/build config.
// Notes for the preview environment:
//  - bind to 0.0.0.0 so the sandbox live-preview proxy can reach it
//  - allow the *.e2b.app preview host
//  - send permissive CORS headers so the Onion runtime running inside an
//    isolated <iframe> (loaded from the Onion CDN) can fetch our .onp files
//    cross-origin. We deliberately do NOT set COOP/COEP: cross-origin
//    isolation would block loading the runtime script from the CDN.
export default defineConfig({
  root: '.',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    allowedHosts: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
})
