# Tushar KB — Portfolio

An interactive 3D film for Tushar KB, cinematographer, filmmaker and video
editor based in Bangalore. Scrolling plays the film: **the person → the camera
→ the edit → the audience → the story.**

Built with **Vite + React + Three.js (React Three Fiber, drei,
postprocessing)**, Framer Motion for the typography, and Lenis for smooth
scroll. Deployed on Netlify.

## The film

| Chapter | Scroll | What happens |
|---|---|---|
| 01 The Person | 0 – 17% | A mannequin under a top light, his name in 3D behind him. Head, neck, spine and eyes track the cursor; the key light pans with it. |
| 02 The Camera | 17 – 42% | A cinema camera (PL mount, knurled lens rings, matte box, rods, follow-focus, monitor, handgrip) flies in; he watches it arrive, takes it in both hands (two-bone IK) and the view orbits the rig. |
| 03 The Edit | 42 – 64% | He turns to a floating NLE: grading wheels, viewer, tools, ruler, markers, video/audio tracks. A 3D mouse drags a clip, razor-cuts another, scrubs the playhead and grades. Scroll explodes the layers in depth, then scatters the clips. |
| 04 The Audience | 64 – 84% | Six extruded platform icons orbit him, scatter and regroup with scroll, lean toward the cursor, and open a preview card on hover (tap on touch). |
| 05 The Story | 84 – 100% | The camera cranes back; contact details, selected work and brands. |

## Editing the site

| File | Contains |
|---|---|
| `src/content/site.js` | Every word: bio, contact, projects, brands, chapter copy, social icons and their links |
| `src/lib/chapters.js` | Chapter ranges and total scroll length |
| `src/scene/CameraRig.jsx` | The camera move — one keyframe list of `[progress, position, look-at]` |
| `src/styles.css` | Design tokens and all DOM styling |

Only the Instagram icon points at a confirmed profile; the other platform icons
have `href: ''` in `site.js` — add links there to make them clickable.

## How it's put together

```
src/
  App.jsx               canvas + overlay + cursor + loader, pointer input
  lib/                  shared per-frame state, scroll (Lenis), chapter ranges, math
  scene/
    Experience.jsx      <Canvas>, adaptive DPR, scene graph
    CameraRig.jsx       scroll → spline camera path, pointer parallax, hand-held drift
    Stage.jsx           floor, volumetric light, dust, lights, 3D name
    Humanoid.jsx        model, gaze tracking, gestures, arm IK
    CinemaCamera.jsx    procedural camera package
    Timeline.jsx        procedural editing timeline + scripted mouse
    SocialIcons.jsx     extruded platform icons + hover cards
    Effects.jsx         DOF, bloom, grain, vignette
  ui/                   DOM overlay, custom cursor, loader
```

Per-frame values (scroll progress, pointer) live in a plain mutable object
(`lib/state.js`) rather than React state, so nothing re-renders at 60 fps.
Scene objects that need each other's positions (the hands and the camera's
grips, the gaze and the timeline's mouse) share them through `lib/anchors.js`.

**Touch devices** get the same film with lighter rendering: no depth of field
or floor reflections, fewer particles, smaller shadow maps, and an idle gaze
that wanders when nobody is touching. `prefers-reduced-motion` disables smooth
scroll and camera drift.

## Assets

- `public/models/xbot.glb` — Mixamo "X Bot" (via the three.js examples),
  trimmed to the `idle`, `agree` and `headShake` clips by
  `scripts/optimize-model.mjs`. Don't resample or quantise it: both corrupt
  this rig's skinning.
- `public/fonts/inter-tight-600.ttf` — for 3D text (troika can't read the woff).
- `public/thumbnail/` — reel stills used on the timeline, monitor and cards.

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Deploying

`netlify.toml` is configured: build `npm run build`, publish `dist`, with an
SPA redirect and long-lived caching on hashed assets.
