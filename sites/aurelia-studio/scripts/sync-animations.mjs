// Copies the canonical .onp library (repo-root /animations) into this site's
// public/animations so Vite serves them same-origin. Run: npm run sync-animations
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../../animations')
const dest = resolve(here, '../public/animations')

mkdirSync(dest, { recursive: true })
let n = 0
for (const f of readdirSync(src)) {
  if (f.endsWith('.onp')) { copyFileSync(join(src, f), join(dest, f)); n++ }
}
console.log(`synced ${n} .onp files → public/animations`)
