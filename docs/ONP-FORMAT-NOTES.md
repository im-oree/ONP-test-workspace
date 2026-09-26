# `.onp` format notes

Notes gathered while inspecting the files in this workspace. This is an
*observational* description of `format: "1.0"` files exported by Onion
`V25.0.0.1`, not an official spec — but it's enough to read, validate and even
hand-author simple files.

## Container

An `.onp` is a plain **ZIP** archive (starts with `PK\x03\x04`). Inside:

```
manifest.json     # small descriptor: comp size, fps, frames, features, assets
scene.json        # the full scene graph (layers + keyframes + effects…)
assets/           # packaged fonts (.ttf), images (.jpg/.png), etc.  (optional)
```

You can unzip any `.onp` with a normal unzip tool to inspect it.

## `manifest.json`

```jsonc
{
  "format": "1.0",
  "generator": "Onion",
  "created": "2026-…Z",
  "capabilities": {
    "format": "1.0",
    "featuresUsed":     ["layer:vector", "vectornode:fill", …],
    "featuresRequired": ["layer:vector", "vectornode:fill", …],  // gate for playback
    "minPlayer": "1.0.0"
  },
  "comp": {
    "rootId": "comp_…",         // matches scene.activeCompositionId
    "width": 1920, "height": 1080,
    "fps": 60, "durationFrames": 600,
    "transparent": true
  },
  "timeControl": { "mode": "autoplay", "loop": true, "markers": [] },
  "assets": [ { "path": "assets/…", "assetId": "…", "kind": "font|image", "mime": "…", "bytes": N } ]
}
```

`featuresRequired` is the interesting one — the runtime uses it (via
`Onion.checkSupport`) to decide whether it can render the file. Feature strings
seen across this library:

- `layer:{vector,text,solid,image,null,camera,adjustment}`
- `vectornode:{path,fill,stroke,trim}`
- `effect:{deepGlow,colorama}`
- `system:packaged-fonts`

## `scene.json`

Top-level keys: `version` (`"1.5"`), `appVersion`, `name`, `compositions`,
`activeCompositionId`, `layers`, `keyframes`, `effects`, `masks`,
`maskEnabledByLayer`, `motionEffects`, `puppet`, `expressions`, `markers`,
`backgrounds`, `assets`.

### Layers

`layers` is a map: `compId → Layer[]`. A layer:

```jsonc
{
  "type": "vector",            // vector | text | solid | image | null | camera | adjustment
  "name": "Ellipse 1",
  "opacity": 100, "blendMode": "normal",
  "transform": {
    "position": { "x": 0, "y": 0 },   // origin is the comp centre; +y is down
    "scale":    { "x": 100, "y": 100 },
    "rotation": 0,
    "anchorPoint": { "x": 0, "y": 0 }
  },
  "startFrame": 0, "endFrame": 600,
  "zIndex": 4,
  "parentId": null,            // parent to another layer's id (e.g. a null) to inherit transform
  "id": "layer_…",
  "data": { … }                // type-specific payload
}
```

Vector `data.contents` is a tree of groups → nodes:

```jsonc
{ "kind": "path",  "node": { "type": "parametric",
    "parametric": { "kind": "ellipse|rectangle", "width": …, "height": …, "roundness": … },
    "bounds": { "minX": …, "minY": …, "maxX": …, "maxY": … } } }
{ "kind": "fill",  "node": { "paint": { "type": "solid", "color": "#RRGGBB" }, "opacity": 100 } }
{ "kind": "stroke","node": { "paint": { "type": "solid", "color": "#RRGGBB" },
    "width": 6, "cap": "round", "join": "round", "align": "center" } }
```

Bezier paths use `"type": "bezier"` with `commands: [{ "type": "M|C", "points": […] }]`.

### Keyframes

Animation lives in a **separate** top-level `keyframes` map, keyed by layer id
then property path:

```jsonc
"keyframes": {
  "layer_…": {
    "transform.position": [
      { "time": 0,   "value": [0.5, 301.5],  "interpolation": "bounce",
        "bounceParams": { "count": 9, "decay": 0.15, "style": "penner", "direction": "out" } },
      { "time": 270, "value": [0.5, -299.5], "interpolation": "bounce", … }
    ],
    "transform.scale":    [ { "time": 0, "value": [100,100], "interpolation": "bezier" }, … ],
    "transform.rotation": [ { "time": 0, "value": 0, "interpolation": "linear" }, … ],
    "transform.opacity":  [ … ]
  }
}
```

- **Property paths**: `transform.position` / `.scale` (vector `[x,y]`),
  `transform.rotation` / `.opacity` (scalar), plus 3D variants like
  `transform3D.rotationY`, and text animators like
  `text.animators.<id>.position.y`.
- **`interpolation`**: `linear`, `bezier` (with `autoBezier`), `hold`, `bounce`
  (with `bounceParams`).
- **`time`** is in **frames**.

## Hand-authoring recipe (used for `aurelia-monogram.onp`)

1. Clone the composition block from a known-good simple scene (keeps all the
   valid `render3D` / `environment3D` boilerplate).
2. Build your `layers[compId]` array and the matching `keyframes` map.
3. Keep `featuresRequired` to what you actually use.
4. Write `scene.json` + `manifest.json`, then ZIP them (with the `assets/`
   folder if any) into a `.onp`.
5. Validate: every `keyframes` layer id and every `parentId` must resolve to a
   real layer; `manifest.comp.rootId === scene.activeCompositionId`.
