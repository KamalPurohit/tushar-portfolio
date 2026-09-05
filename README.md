# Tushar KB — Portfolio

Personal portfolio for Tushar KB, filmmaker and visual creative based in Bangalore.

Built with **Vite + React + Tailwind CSS v4**, deployed on Netlify.

## Design system

The visual language follows a GSAP-derived dark design system:

- A single near-black canvas (`#0e100f`) that is never broken by a light section
- Warm cream type (`#fffce1`) rather than pure white
- **Outlined-only controls** — no filled CTAs. The one chromatic escalation is
  the green gradient-stroked pill used for the primary contact action
- A colour-per-discipline taxonomy: Direction (pink), Cinematography (orange),
  Editing (violet), Content & Social (blue). A hue is never reused across
  disciplines, and each discipline's illustration carries its own colour
- Curly-bracket section eyebrows — `{ About Me }` — as a recurring signature
- Depth from gradients and surface steps only; **no box-shadows anywhere**

## Editing the site

Two files cover almost everything:

| File | Contains |
|------|----------|
| `src/content/site.js` | Every word on the site — bio, projects, reels, brands, contact details |
| `src/styles/index.css` | Every design token — colours, type scale, radii, layout |

Changing a token in the `@theme` block reskins the whole site; no component
needs to be touched.

## Images

- **Video thumbnails** are pulled live from `img.youtube.com` using each
  project's `youtubeId`, so there is nothing to commit.
- **Reel stills** are expected at `public/img/thumbnail/insta1–6.jpg`. Until
  those files are added, each tile falls back to generated gradient artwork —
  the layout is identical either way, so they can be dropped in at any time.
- **Brand names** render as typographic tiles rather than logo images.

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
