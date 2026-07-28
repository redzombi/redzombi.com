# REDZOMBI LABS

A personal digital playground — quick thoughts, real posts, and whatever
project gets plugged in next. No roadmap, no deadline, mostly static.
Deployed to Cloudflare as a Worker with static assets.

## Stack

Plain HTML/CSS/vanilla JS for the site itself — no framework, no bundler,
no `node_modules`. Content lives in JSON files (and markdown for posts)
and gets fetched client-side. Edit, commit, push — Cloudflare redeploys
automatically. The one external dependency is `marked.js` (plus
`highlight.js` for code blocks), loaded from a CDN in `index.html` — same
low-friction pattern as the Google Fonts `@import` in the stylesheet.

The one piece of real server-side logic is `src/index.js` — a small
Cloudflare Worker, described under Structure and Deploy below. Everything
else is static files served as-is.

## Structure

```text
lab-site/                     the static site — served as-is via the
                               `assets` binding in wrangler.jsonc
  index.html                  the whole page (header, hero, log, posts, projects)
  assets/
    css/style.css              design tokens + layout (CRT/PRINT themes live here)
    js/main.js                 theme toggle, clock, renders the three feeds
    img/favicon.svg
  data/
    log.json                   real log entries — starts empty
    log.example.json           schema reference, not loaded by the site
    posts.json                 real post index — starts empty
    posts.example.json         schema reference, not loaded by the site
    projects.json               real project entries — starts empty
    projects.example.json       schema reference, not loaded by the site
  posts/
    <slug>.md                  markdown body for each posts.json entry
    README.md                  posts authoring convention
  DEPLOY.md                    Cloudflare connection steps
  CHANGELOG.md                 dev log for the site itself (not the /log — see below)
src/
  index.js                     Worker entry point. Only runs for requests
                                with no matching static file — currently
                                just /post/<slug>, to inject that post's
                                real title/OG/Twitter tags before a crawler
                                reads the page (see below). Everything else
                                (/, /assets/*, /data/*.json, /posts/*.md)
                                is served directly from `lab-site/` without
                                touching this script at all.
wrangler.jsonc                 Worker config: name, entry point (main),
                                and the `assets` binding pointing at
                                `lab-site/`. Committed so Cloudflare's build
                                (`npx wrangler deploy`) uses it directly
                                instead of re-guessing settings every build.
README.md                     this file
```

## Adding a log entry

Zero-ceremony quick-dump feed. Open `data/log.json` and add an object — see
`data/log.example.json` for the shape (`date`, `body`, optional `tag`).
Newest first, automatically.

## Adding a post

1. Add an entry to `data/posts.json` — see `data/posts.example.json` for the
   full field list (`slug`, `title`, `date`, `tags`, `summary`).
2. Drop a matching `posts/<slug>.md` file with the post body (plain markdown,
   start with an `# H1` title, no frontmatter needed).

Posts render at `/post/<slug>`. That path has no matching static file, so
it falls through to the Worker (`src/index.js`), which looks up the post in
`data/posts.json` and rewrites the page's `<title>`/OG/Twitter tags to
match before the client-side JS takes over and renders the body — so
shared links preview with the real title and summary instead of the
homepage's. Nothing else to configure; every other path is unaffected and
served as a plain static file.

## Adding a project

Open `data/projects.json` and add an object — see
`data/projects.example.json` for the full field list (`name`, `status`,
`description`, optional `url` / `linkLabel`). `status` is one of `idea`,
`building`, `live`, `archived`.

Note the distinction: `data/log.json`, `data/posts.json`, and
`data/projects.json` are the *real* content, rendered on the page.
`CHANGELOG.md` is a normal dev changelog for changes to the site's own code.
Two different logs, two different audiences.

## Local preview

For the static pages only (no `/post/<slug>` routing, since that needs the
Worker):

```bash
python3 -m http.server 8000 --directory lab-site
# then open http://localhost:8000
```

To preview the real thing, including the Worker and `/post/<slug>`, run
Wrangler from the repo root (reads `wrangler.jsonc` directly):

```bash
npx wrangler dev
# then open http://localhost:8787
```

## Theming

CRT (dark, default) is red-on-black terminal styling with a scanline
overlay and a blinking cursor — follows `prefers-color-scheme` by default.
PRINT (light) is a paper/dot-matrix printout look with hard-edged brutalist
card borders. The switch in the header sets a manual override
(`data-theme` on `<html>`, persisted in `localStorage`) that wins over
system preference until cleared. All colors are CSS custom properties in
`assets/css/style.css` — tokens end in `-crt` or `-print`.

## Deploy

See `lab-site/DEPLOY.md` for connecting this repo to Cloudflare. Short
version: Cloudflare runs `npx wrangler deploy` from the repo root on every
push to `main`, which reads `wrangler.jsonc` and deploys `src/index.js`
with `lab-site/` bound as static assets.
