import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ANIMATIONS } from './onp-config.js'
import { loadOnionSDK } from './sdk-loader.js'
import { mountDirect, mountIsolated, paintPoster } from './embeds.js'

gsap.registerPlugin(ScrollTrigger)

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]

// ── Works grid definition (layout spans + which .onp) ──────────────────
const WORKS = [
  { key: 'carousel', span: 'span-4', ratio: 'ratio-wide' },
  { key: 'monogram', span: 'span-2', ratio: 'ratio-square' },
  { key: 'jackjill', span: 'span-3', ratio: 'ratio-wide' },
  { key: 'ball', span: 'span-3', ratio: 'ratio-wide' },
  { key: 'badge', span: 'span-2', ratio: 'ratio-square' },
  { key: 'liquid', span: 'span-4', ratio: 'ratio-wide' },
]

function buildWorksGrid() {
  const grid = $('#works-grid')
  WORKS.forEach(({ key, span, ratio }) => {
    const meta = ANIMATIONS[key]
    const card = document.createElement('article')
    card.className = `work-card ${span} ${ratio}`
    card.innerHTML = `
      <div class="onp-slot" data-anim="${key}" data-mode="iso"></div>
      <div class="work-cap">
        <b>${meta.title}</b>
        <span>${meta.frames}f · ${meta.fps}fps</span>
      </div>`
    grid.appendChild(card)
  })
}

// ── SDK status chip ────────────────────────────────────────────────────
function setChip(state, html) {
  const chip = $('#sdk-chip')
  const dot = chip.querySelector('.dot')
  dot.className = 'dot ' + (state === 'ok' ? 'dot-ok' : state === 'fail' ? 'dot-fail' : 'dot-wait')
  $('#sdk-chip-text').innerHTML = html
}

// ── Poster placeholders shown immediately for every slot ───────────────
function paintAllPosters() {
  $$('.onp-slot').forEach((slot) => {
    const meta = ANIMATIONS[slot.dataset.anim]
    if (meta) paintPoster(slot, meta, { reason: 'pending' })
  })
}

// ── Mount every embed once the SDK is ready ────────────────────────────
async function mountEmbeds() {
  // Direct player first (single per-realm). Then all isolated ones.
  const directSlot = $('.onp-slot[data-mode="direct"]')
  if (directSlot) {
    const player = await mountDirect(directSlot, ANIMATIONS[directSlot.dataset.anim], {
      autoplay: true, loop: true, fitMode: 'contain',
    })
    if (player) wireConsole(player)
  }

  for (const slot of $$('.onp-slot[data-mode="iso"], .onp-slot[data-mode="iso-hero"]')) {
    const meta = ANIMATIONS[slot.dataset.anim]
    const isHero = slot.dataset.mode === 'iso-hero'
    mountIsolated(slot, meta, {
      autoplay: true, loop: true,
      lazy: !isHero,
      rootMargin: isHero ? '0px' : '400px',
    })
  }

  // Scroll-scrubbed showcase (paused; frame driven by ScrollTrigger).
  const scrubSlot = $('.onp-slot[data-mode="scrub"]')
  if (scrubSlot) setupScrub(scrubSlot, ANIMATIONS[scrubSlot.dataset.anim])
}

// ── Scroll-driven playback (GSAP ScrollTrigger → seekFrame) ─────────────
function setupScrub(slot, meta) {
  const handle = mountIsolated(slot, meta, { autoplay: false, loop: false, lazy: false })
  if (!handle) return
  const total = meta.frames - 1
  $('#scrub-total').textContent = meta.frames

  const fill = $('#scrub-fill')
  const frameOut = $('#scrub-frame')
  let ready = false
  Promise.resolve(handle.ready).then(() => { ready = true; try { handle.pause() } catch {} }).catch(() => {})

  ScrollTrigger.create({
    trigger: '#showcase',
    start: 'top top',
    end: '+=220%',
    pin: '.showcase-pin',
    scrub: 0.6,
    onUpdate: (self) => {
      const frame = Math.round(self.progress * total)
      if (ready) { try { handle.seekFrame(frame) } catch {} }
      fill.style.width = (self.progress * 100).toFixed(1) + '%'
      frameOut.textContent = frame
    },
  })
}

// ── Console (direct OnionPlayer full API) ──────────────────────────────
function wireConsole(player) {
  const snap = $('#snapshot')
  const seek = $('#seek')
  const rate = $('#rate')
  const rateVal = $('#rate-val')
  seek.max = String((player.duration || 360) - 1)

  const act = {
    play: () => player.play(),
    pause: () => player.pause(),
    stop: () => player.stop(),
    restart: () => player.goToAndPlay(0),
    fwd: () => player.setDirection(1),
    rev: () => player.setDirection(-1),
    bounce: (btn) => {
      const on = btn.dataset.toggle === 'on'
      player.setBounce(!on)
      btn.dataset.toggle = on ? 'off' : 'on'
      btn.textContent = 'Bounce: ' + (on ? 'off' : 'on')
      btn.classList.toggle('active', !on)
    },
    setvar: () => {
      const name = $('#var-name').value.trim()
      const val = $('#var-val').value.trim()
      if (name) { try { player.setVariable(name, val) } catch (e) { console.warn(e) } }
    },
  }
  $$('.console-panel [data-act]').forEach((btn) =>
    btn.addEventListener('click', () => act[btn.dataset.act]?.(btn)))

  $$('#fit-row [data-fit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      player.setFitMode(btn.dataset.fit)
      $$('#fit-row [data-fit]').forEach((b) => b.classList.toggle('active', b === btn))
    }))

  seek.addEventListener('input', () => player.seekFrame(Number(seek.value)))
  rate.addEventListener('input', () => {
    const r = Number(rate.value)
    player.setRate(r)
    rateVal.textContent = r.toFixed(1) + '×'
  })

  // Live snapshot + keep the seek slider in sync while playing.
  player.on('frame', (f) => {
    if (document.activeElement !== seek) seek.value = String(Math.round(f))
  })
  const tick = () => {
    const s = player.snapshot()
    snap.textContent = JSON.stringify({
      playing: s.playing, frame: Math.round(s.frame), duration: s.duration,
      fps: s.fps, rate: s.rate, direction: player.direction,
      bounce: player.bounce, fitMode: s.fitMode, loop: s.loop,
    }, null, 2)
  }
  tick()
  setInterval(tick, 250)
}

// ── GSAP reveals + nav + marquee niceties ──────────────────────────────
function setupReveals() {
  const nav = $('#nav')
  ScrollTrigger.create({ start: 'top -40', onUpdate: (s) => nav.classList.toggle('scrolled', s.scroll() > 40) })
  nav.classList.toggle('scrolled', window.scrollY > 40)

  $$('[data-reveal]').forEach((el) => {
    gsap.fromTo(el, { y: 34, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    })
  })
  gsap.fromTo('[data-reveal-line]', { yPercent: 115 }, {
    yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 0.15,
  })
  $$('.work-card').forEach((card, i) => {
    gsap.fromTo(card, { y: 50, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', delay: (i % 3) * 0.06,
      scrollTrigger: { trigger: card, start: 'top 92%' },
    })
  })
}

// ── Boot ───────────────────────────────────────────────────────────────
async function boot() {
  buildWorksGrid()
  paintAllPosters()
  setupReveals()

  const res = await loadOnionSDK()
  if (res.ok) {
    setChip('ok', `Onion runtime <code>${res.version || 'live'}</code> · ready`)
    await mountEmbeds()
    // Recalculate pin positions after embeds change layout.
    ScrollTrigger.refresh()
  } else {
    setChip('fail', 'Onion runtime unavailable — showing posters. Live playback needs network access to the Onion CDN.')
    console.warn('[aurelia] Onion SDK failed to load from all candidates; posters remain.')
  }
}

boot()
