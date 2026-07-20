# Range Control

A personal testing ground — cybersecurity experiments, space and technology
rabbit holes, whatever's worth building just to see what happens. Separate
from the day job. Separate from other projects. Plus a running scratch
notebook. Static, no build step, deployed on Cloudflare Pages.

## Stack

Plain HTML/CSS/vanilla JS. No framework, no bundler, no `node_modules`.
Content lives in two JSON files and gets fetched client-side. Edit,
commit, push — Cloudflare Pages redeploys automatically.

## Structure

```
index.html                   the whole page (header, hero, modules, notebook)
assets/
  css/style.css               design tokens + layout (day/night themes live here)
  js/main.js                  theme toggle, clock, renders modules.json / notebook.json
  img/favicon.svg
data/
  modules.json                real module entries — starts empty
  notebook.json                real notebook entries — starts empty
  modules.example.json        schema reference, not loaded by the site
  notebook.example.json       schema reference, not loaded by the site
README.md                     this file
DEPLOY.md                     Cloudflare Pages connection steps
CHANGELOG.md                  dev log for the site itself (not the /notebook — see below)
```

## Adding a module

Open `data/modules.json` and add an object (see `data/modules.example.json`
for the full field list — `title`, `status`, `description`, and optional
`url` / `linkLabel`). Empty array renders the "no modules yet" state
automatically, so there's nothing else to toggle.

## Adding a notebook entry

Same pattern in `data/notebook.json` — `date` (YYYY-MM-DD), `title`, `body`,
optional `tag`. Entries sort newest-first automatically regardless of the
order you add them in.

Note the distinction: `data/notebook.json` is *your* notebook, rendered on
the page. `CHANGELOG.md` is a normal dev changelog for changes to the
site's code itself. Two different logs, two different audiences.

## Local preview

No build step needed, but you do need a local server (not `file://`,
since `fetch()` for the JSON won't work over the file protocol):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Theming

Day/night follows the OS-level `prefers-color-scheme` by default. Day is
an ops-deck-daylight look; night switches to red/amber lighting, the same
principle cockpits and ready rooms use to preserve night vision. The
switch in the header sets a manual override (`data-theme` on `<html>`,
persisted in `localStorage`) that wins over system preference until
cleared. All colors are CSS custom properties in `assets/css/style.css` —
day tokens end in `-day`, night tokens end in `-night`.

## Deploy

See `DEPLOY.md` for connecting this repo to Cloudflare Pages. Short
version: no build command, output directory is `/` (repo root).
