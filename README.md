# Toni Santafé — Portfolio v2

Static site, no build step. Open `index.html` in a browser or upload the whole folder to any host.

## Structure
- `index.html` — Home: intro → Projects → About → Resume → Contact
- `project.html?p=<slug>` — Project detail (one template for all projects)
- `assets/js/data.js` — **All project texts live here** (title, client, services, description, order)
- `assets/img/<slug>/` — `cover.webp`, `thumb.webp` and the presentation sheet cut into `sNN-NN.webp` slices
- `assets/css/main.css` — Design tokens at the top (`--accent` is the acid colour; `#ffeb00` brings back the original yellow)
- `assets/js/glass.js` — WebGL iridescent glass (auto-lowers quality on slow GPUs, CSS fallback without WebGL)
- `assets/vendor/` — GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (local, no CDN)
- `assets/fonts/` — Archivo (variable width/weight) and JetBrains Mono, self-hosted (OFL)

## Adding a project
1. Export the sheet, cut it into slices (≤1920 px wide) + a 1600×1000 `cover.webp` and 720×450 `thumb.webp`.
2. Add an entry to `data.js` with its `slices` list. Order in the array = order on the site.
