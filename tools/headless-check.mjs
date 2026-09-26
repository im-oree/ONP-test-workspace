// Headless verification harness for Aurelia Studio.
// Uses playwright-core driving the @sparticuz/chromium binary (the only
// Chromium obtainable in this npm-only sandbox). Run via tools/run-headless.sh
//
// Usage: node headless-check.mjs <url> <outDir>
import { chromium as pw } from 'playwright-core'
import sparticuz from '@sparticuz/chromium'

const url = process.argv[2] || 'http://localhost:5173/'
const outDir = process.argv[3] || '.'

const exe = await sparticuz.executablePath()
const browser = await pw.launch({ executablePath: exe, args: sparticuz.args, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
await page.waitForTimeout(3000)

const info = await page.evaluate(() => ({
  title: document.title,
  slots: document.querySelectorAll('.onp-slot').length,
  posters: document.querySelectorAll('.onp-slot.onp-poster').length,
  stages: document.querySelectorAll('.onp-stage').length,
  workCards: document.querySelectorAll('.work-card').length,
  chip: document.querySelector('#sdk-chip-text')?.textContent,
  navExists: !!document.querySelector('.nav'),
  consoleStage: !!document.querySelector('.console-stage'),
  heroTitle: document.querySelector('.hero-title')?.innerText,
}))
console.log('INFO ' + JSON.stringify(info, null, 2))

await page.screenshot({ path: `${outDir}/verify-hero.png` })

// Scroll through to exercise ScrollTrigger pin + reveals, then full-page shot.
const h = await page.evaluate(() => document.body.scrollHeight)
for (let y = 0; y < h; y += 700) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120) }
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/verify-full.png`, fullPage: true })

// Zoom the console section for a closer look.
const console_ = await page.$('.playground')
if (console_) { await console_.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await page.screenshot({ path: `${outDir}/verify-console.png` }) }

console.log(`ERRORS(${errors.length}):`)
for (const e of errors.slice(0, 25)) console.log('  - ' + e)

await browser.close()
