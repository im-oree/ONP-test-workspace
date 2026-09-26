# Embedding .onp Animations — Complete SDK Reference

## 1 — Build the SDK

```bash
npx vite build --config vite.onp-runtime.config.ts
```

Output in `dist-onp/`:

| File | Format | Usage |
|------|--------|-------|
| `onp-runtime.umd.js` | UMD (`<script>`) | Sets `window.Onion` |
| `onp-runtime.mjs` | ESM (`import`) | Bundlers / `<script type="module">` |

## 2 — Host the files

Put the SDK JS **and your `.onp` files** anywhere public:

- **Same repo** — commit `dist-onp/` + `.onp` files, deploy to Vercel/Netlify/GitHub Pages
- **GitHub raw** — `https://raw.githubusercontent.com/you/repo/main/file.onp`
- **Any static host** — S3, Cloudflare R2, your own server

## 3 — Embed: Plain `<script>` (simplest)

```html
<script src="https://your-host.com/onp-runtime.umd.js"></script>
<div id="hero" style="width:600px;height:400px"></div>
<script>
  Onion.mount('#hero', { src: 'https://your-host.com/anim.onp', autoplay: true, loop: true });
</script>
```

## 4 — Embed: ESM / Bundlers

```html
<script type="module">
  import { mount } from 'https://your-host.com/onp-runtime.mjs';
  mount('#hero', { src: 'https://your-host.com/anim.onp', autoplay: true, loop: true });
</script>
```

## 5 — Embed: Zero JS Custom Element

```html
<script src="https://your-host.com/onp-runtime.umd.js"></script>
<onion-player src="https://your-host.com/anim.onp" autoplay loop
  style="width:600px;height:400px;display:block"></onion-player>
```

Auto-registered on script load. No JS needed.

---

# Complete API Reference

## Top-Level Functions

Everything below is available on `window.Onion` (UMD) or as named exports (ESM).

### `Onion.mount(target, options): Promise<OnionPlayer>`

The primary embedding call. Fetches the `.onp`, boots the renderer, returns the player.

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `string \| HTMLElement` | CSS selector or DOM element to render into |
| `options` | `MountOptions` | See below |

**MountOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | — | URL to the `.onp` file. Required unless `bytes` is provided |
| `bytes` | `Uint8Array \| ArrayBuffer` | — | Raw `.onp` bytes (for drag-drop, XHR, etc.) |
| `request` | `RequestInit` | — | Passed to `fetch()` — set `credentials`, custom headers, `AbortSignal` |
| `autoplay` | `boolean` | `true` | Start playing immediately |
| `loop` | `boolean` | `true` | Loop playback |
| `muted` | `boolean` | `false` | Mute audio |
| `componentId` | `string` | `'root'` | Which packaged component to activate |
| `initialState` | `string` | — | Named interaction state to enter on load |
| `onReady` | `(player) => void` | — | Called when first frame is rendered |
| `onError` | `(error) => void` | — | Called on load/playback failure. Without it, errors reject the Promise |

### `Onion.mountIsolated(target, options): IsolatedHandle`

Mounts inside its own iframe — required for **multiple animations on one page** (the renderer allows only one player per JS realm).

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | — | URL to the `.onp` file (required) |
| `runtimeUrl` | `string` | auto-detected | URL to load the SDK inside the iframe |
| `lazy` | `boolean` | `true` | Only create the player when the element scrolls into view |
| `rootMargin` | `string` | `'200px'` | IntersectionObserver margin for lazy loading |
| `unmountDelayMs` | `number` | `2000` | Grace period before tearing down an off-screen player |
| + all `MountOptions` | | | Same as `mount()` |

**IsolatedHandle returned:**

| Property/Method | Type | Description |
|--------|------|-------------|
| `frame` | `HTMLIFrameElement \| null` | The created iframe (null if lazy and not yet visible) |
| `play()` | `void` | Play (proxied into iframe) |
| `pause()` | `void` | Pause |
| `seekFrame(frame)` | `void` | Seek to frame |
| `setState(name)` | `void` | Enter an interaction state |
| `ready` | `Promise<void>` | Resolves when the inner player is loaded |
| `dispose()` | `void` | Tear down the iframe and player |

### `Onion.inspect(bytes): OnpInfo`

Parse an `.onp` without rendering — no GPU needed. Works in Node.js.

```ts
const bytes = await fetch('anim.onp').then(r => r.arrayBuffer());
const info = Onion.inspect(bytes);
```

**OnpInfo returned:**

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Composition width in pixels |
| `height` | `number` | Composition height in pixels |
| `fps` | `number` | Frame rate |
| `durationFrames` | `number` | Total frames |
| `durationSeconds` | `number` | Total duration in seconds |
| `transparent` | `boolean` | Whether the comp has transparency (for borderless embeds) |
| `markers` | `OnpMarker[]` | Named cue points / regions in the timeline |
| `featuresRequired` | `string[]` | Renderer features the file needs (e.g. `'layer:text'`) |
| `components` | `string[]` | Packaged component IDs in the file |
| `generator` | `string` | Which Onion build wrote the file |
| `manifest` | `OnpManifest` | Full raw manifest object |

### `Onion.checkSupport(bytes): Promise<{ supported, missing }>`

Check if this SDK build can render the file.

```ts
const { supported, missing } = await Onion.checkSupport(bytes);
if (!supported) console.warn('Missing features:', missing);
```

### `Onion.fetchOnp(url, requestInit?): Promise<Uint8Array>`

Fetch `.onp` bytes from a URL. Used internally by `mount()`, exposed for manual loading.

### `Onion.defineElement(tag?): void`

Register the `<onion-player>` custom element. Called automatically on script load. Pass a custom tag name if needed: `Onion.defineElement('my-player')`.

### `Onion.VERSION: string`

SDK version string (e.g. `"2026.9.0.1+eae8e12c0"`).

---

## OnionPlayer Instance — Full API

Returned by `await Onion.mount(...)`. This is the complete control surface.

### Read-Only Properties

| Property | Type | Description |
|----------|------|-------------|
| `player.playing` | `boolean` | Whether the animation is currently playing |
| `player.frame` | `number` | Current frame number |
| `player.duration` | `number` | Total frames in the active component |
| `player.fps` | `number` | Frame rate |
| `player.size` | `{ width, height }` | Composition dimensions in pixels |
| `player.loop` | `boolean` | Whether looping is enabled |
| `player.direction` | `1 \| -1` | Current playback direction (1 = forward, -1 = reverse) |
| `player.frozen` | `boolean` | Whether rendering is frozen (logical clock still runs) |
| `player.bounce` | `boolean` | Whether bounce (ping-pong) mode is on |
| `player.fitMode` | `string` | Current fit mode: `'contain'`, `'cover'`, `'fill'`, or `'none'` |
| `player.loopRange` | `{ start, end } \| null` | Active loop range in frames, or null for full comp |
| `player.muted` | `boolean` | Whether audio is muted |
| `player.volume` | `number` | Audio volume (0–1) |
| `player.rate` | `number` | Playback speed multiplier |
| `player.state` | `string \| null` | Current interaction state name, or null |
| `player.states` | `EmbedStateDef[] \| null` | All declared interaction states |
| `player.markers` | `OnpMarker[]` | Named cue points / regions on the timeline |
| `player.manifest` | `OnpManifest \| null` | Raw file manifest |
| `player.presentation` | `PresentationController \| null` | Presentation deck (from markers). Null if no markers |
| `player.componentId` | `string \| null` | Active packaged component ID |
| `player.components` | `ComponentDefinition[] \| null` | All packaged components in the file |
| `player.globalState` | `string \| null` | Global state shared across all components |
| `player.drivers` | `DriverController[]` | Registered input drivers |
| `player.variables` | `ReadonlyMap<string, unknown>` | All runtime variable overrides |
| `player.audio` | `PlayerAudioState` | Audio output status (`{ status, message }`) |

### Playback Controls

```ts
player.play()                         // Start or resume playback
player.pause()                        // Pause playback
player.stop()                         // Stop and reset to frame 0
player.seekFrame(frame: number)       // Jump to a specific frame
player.seek(seconds: number)          // Jump to a time in seconds
player.setLoop(loop: boolean)         // Enable/disable looping
player.setRate(rate: number)          // Set playback speed (0.1–16)
player.setDirection(dir: 1 | -1)      // 1 = forward, -1 = reverse
```

### Lottie-Parity Methods

Drop-in replacements for lottie-web API methods:

```ts
player.goToAndPlay(frame: number, isFrame?: boolean)
// Seek to frame (or seconds if isFrame=false) and play.
// isFrame defaults to true.

player.goToAndStop(frame: number, isFrame?: boolean)
// Seek to frame (or seconds if isFrame=false) and pause.

player.playSegments(segments: [number, number] | [number, number][], forceFlag?: boolean)
// Play a frame range. [start, end] or array of ranges.
// forceFlag=true seeks to start immediately.
// Examples:
//   player.playSegments([0, 30])              // play frames 0-30
//   player.playSegments([[0, 30], [60, 90]])   // play two segments

player.freeze()
// Suspend rendering without stopping the clock.
// The player stays "playing" but skips frame uploads.
// Use for off-screen optimization.

player.unfreeze()
// Resume rendering after freeze().

player.setBounce(bounce: boolean)
// Enable ping-pong: direction reverses at each loop boundary.
```

### Loop Range

```ts
player.setLoopRange(startFrame: number, endFrame: number)
// Constrain the loop to a sub-range of frames.

player.setLoopRange(null)
// Remove constraint, loop the full composition.
```

### Fit Mode (Responsive Sizing)

```ts
player.setFitMode(mode: 'contain' | 'cover' | 'fill' | 'none')
```

| Mode | Behavior |
|------|----------|
| `contain` | Letterbox to fit (default, like CSS `object-fit: contain`) |
| `cover` | Scale to cover, cropping overflow |
| `fill` | Stretch to fill exactly |
| `none` | Render at native resolution, centered |

### Audio

```ts
player.setMuted(muted: boolean)       // Mute/unmute
player.setVolume(volume: number)      // Set volume 0–1
```

### Runtime Variables (Text/Color/Value Overrides)

Designers author named expression controls or text source IDs. You override them at runtime:

```ts
player.setVariable('headline', 'Summer Sale')   // Override a text layer
player.setVariable('brandColor', '#ff6600')      // Override a color
player.setVariable('price', 29.99)               // Override a numeric value

player.getVariable('headline')                   // Read current value
player.variables                                 // ReadonlyMap of all overrides
```

Text layers with matching `textOverrideId` update their content. Color layers with matching `colorOverrideId` update their fill.

### Interaction States

Named segments in the timeline that can be triggered programmatically:

```ts
player.setState('hover')              // Activate a named state and play its segment
player.clearState()                   // Leave the current state, resume full range
player.nextState()                    // Advance to the next declared state
player.prevState()                    // Return to the previous state
player.state                          // Current state name (string | null)
player.states                         // All declared states
```

### Packaged Components

An `.onp` can contain multiple sub-animations (buttons, icons, sub-scenes):

```ts
player.components                     // List all components
player.componentId                    // Active component ID
player.getComponent('button-cta')     // Get a component definition by ID

player.setGlobalState('dark')                        // Set global state for all components
player.setComponentState('button-cta', 'pressed')    // Set one component's state
player.componentState('button-cta')                  // Read effective state
```

### Named Markers & Segments

```ts
player.markers                        // All named cue points/regions

player.playSegment('intro')           // Play a named segment by marker name
player.playSection('chapter1')        // Play a named section (presentation marker)
player.playSection(2)                 // Play section by index
```

Markers fire enter/leave events for regions (markers with duration).

### Presentation Mode

Built-in slide-deck support using presentation markers:

```ts
player.presentation                   // PresentationController (null if no markers)
// Use playSection() to navigate between sections
```

### Input Drivers (Scroll/Pointer/Hover)

Bind animation progress to scroll position, mouse, or other inputs:

```ts
const driver = player.createDriver({
  type: 'scroll',       // 'scroll' | 'pointer' | 'hover' | 'manual'
  // ... driver-specific options
});

player.updateDrivers(dtMs)            // Advance all drivers (call per frame)
player.removeDriver(driver)           // Remove one driver
player.clearDrivers()                 // Remove all drivers
player.drivers                        // List all active drivers
```

### Events

```ts
const off = player.on(event, callback)
// Subscribe. Returns an unsubscribe function.
// Call off() to remove the listener.
```

| Event | Payload | When |
|-------|---------|------|
| `'frame'` | `number` (frame) | Every rendered frame |
| `'complete'` | — | Animation reaches its end (non-looping) |
| `'loop'` | — | Animation loops back to start |
| `'error'` | `Error` | Playback/rendering error |
| `'sectionStart'` | `{ name, frame }` | Playhead enters a named marker region |
| `'sectionEnd'` | `{ name, frame, index, startFrame, endFrame }` | Playhead leaves a named marker region |
| `'stateChange'` | `{ state, startFrame?, endFrame? }` | Interaction state changed |

### Promise-Based Event Waiting

```ts
await player.until('complete')                        // Wait for animation end
await player.until('loop')                            // Wait for next loop
await player.until('frame')                           // Wait for next frame
await player.until('markerReach', 'splashDone')       // Wait for a specific named marker
```

Rejects with `AbortError` if the player is disposed before the event fires.

### Snapshot

```ts
const snapshot = player.snapshot()
// Returns a serializable object of the player's full state:
// { playing, frame, duration, fps, loop, muted, volume, rate, state, fitMode, loopRange }
// Use this to build external control UIs (React, Vue, etc.)
```

### Cleanup

```ts
player.dispose()    // Tear down the player, release GPU resources, remove listeners
```

Always call this when removing an animation from the page. Failure to dispose leaks the renderer realm lock and prevents future `mount()` calls.

---

## `<onion-player>` Custom Element

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `src` | `string` | URL to `.onp` file (required) |
| `autoplay` | boolean attr | Start playing on load |
| `loop` | boolean attr | Loop playback |
| `muted` | boolean attr | Mute audio |
| `component` | `string` | Packaged component ID to activate |
| `state` | `string` | Initial interaction state |

### Events

```js
el.addEventListener('ready', (e) => {
  const player = e.detail.player;       // OnionPlayer instance (direct mount)
  const handle = e.detail.isolated;     // IsolatedHandle (iframe mount)
});

el.addEventListener('error', (e) => {
  console.error(e.detail.error);
});
```

### Access the player

```js
const el = document.querySelector('onion-player');
el.player  // OnionPlayer instance (null before 'ready' fires)
```

### Auto-isolation

The first `<onion-player>` on a page mounts directly (fastest). Every subsequent one automatically gets its own iframe (because the renderer allows one player per JS realm). This is handled transparently.

---

## Prompt for ChatGPT / AI Agent

Copy-paste this to any AI to build a website with `.onp` animations:

> **Build me a website that embeds Onion `.onp` animations.**
>
> Load the Onion Player SDK:
> ```html
> <script src="SDK_URL/onp-runtime.umd.js"></script>
> ```
>
> **Simplest embed — custom element (no JS):**
> ```html
> <onion-player src="FILE_URL/anim.onp" autoplay loop
>   style="width:600px;height:400px;display:block"></onion-player>
> ```
>
> **With JS control:**
> ```js
> const player = await Onion.mount('#container', {
>   src: 'FILE_URL/anim.onp',
>   autoplay: true,
>   loop: true,
>   onReady: (p) => console.log('Loaded!', p.duration, 'frames at', p.fps, 'fps'),
> });
>
> // Full transport
> player.play(); player.pause(); player.stop();
> player.seekFrame(30); player.seek(1.5); // seconds
> player.setRate(2); player.setDirection(-1);
> player.goToAndPlay(0); player.goToAndStop(60);
> player.playSegments([10, 50]);
> player.setLoop(true); player.setLoopRange(20, 80);
> player.setFitMode('cover'); // 'contain'|'cover'|'fill'|'none'
> player.setBounce(true); // ping-pong
> player.freeze(); player.unfreeze(); // suspend/resume rendering
>
> // Audio
> player.setMuted(false); player.setVolume(0.8);
>
> // Runtime overrides
> player.setVariable('headline', 'New Text');
> player.setVariable('brandColor', '#ff6600');
>
> // States & components
> player.setState('hover'); player.clearState();
> player.setGlobalState('dark');
>
> // Events
> player.on('frame', (f) => {}); player.on('complete', () => {});
> player.on('loop', () => {}); player.on('sectionStart', (e) => {});
> await player.until('complete');
> await player.until('markerReach', 'splashDone');
>
> // Read-only info
> player.frame; player.duration; player.fps; player.size;
> player.playing; player.markers; player.snapshot();
>
> // Cleanup
> player.dispose();
> ```
>
> **Multiple animations:** use `Onion.mountIsolated('#el', { src: '...' })` — each gets its own iframe. Supports lazy loading (only renders when scrolled into view).
>
> **Inspect without rendering:** `Onion.inspect(bytes)` returns `{ width, height, fps, durationFrames, durationSeconds, transparent, markers, featuresRequired, components }`.
>
> Replace `SDK_URL` and `FILE_URL` with your hosted URLs.

---

## Quick Checklist

1. Build: `npx vite build --config vite.onp-runtime.config.ts` → `dist-onp/`
2. Host `onp-runtime.umd.js` + your `.onp` files somewhere public
3. Add `<script src="...umd.js">` to your page
4. `Onion.mount('#el', { src: '...onp' })` or `<onion-player src="...">` — done
