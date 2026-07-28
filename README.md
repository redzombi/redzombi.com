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
else is static files served as-is. The Worker also backs two small dynamic
features (the signal meter and the guestbook — see "Fun stuff" below),
which need a Cloudflare KV namespace; see Deploy.

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
                                with no matching static file:
                                  - /post/<slug>          per-post OG tags
                                  - /api/signal/<slug>    signal meter (KV)
                                  - /api/guestbook        guestbook (KV)
                                Everything else (/, /assets/*, /data/*.json,
                                /posts/*.md) is served directly from
                                `lab-site/` without touching this script.
wrangler.jsonc                 Worker config: name, entry point (main), the
                                `assets` binding pointing at `lab-site/`,
                                and the `LAB_KV` namespace binding. Committed
                                so Cloudflare's build (`npx wrangler deploy`)
                                uses it directly instead of re-guessing
                                settings every build.
README.md                     this file
```

## Fun stuff

A few things layered on top of the log/posts/projects model, mostly for
the fun of it:

- **Command palette easter eggs** (`/` to open) — `whoami`, `sudo`,
  `neofetch`, and `cat log.json` alongside the real `help`/`uptime`
  commands, rendered inline in the palette instead of a native `alert()`.
  There's also a Konami code (↑↑↓↓←→←→BA) wired to a matrix-rain canvas
  effect — see the "konami code" section in `main.js`.
- **Signal meter** (on each post) — a KV-backed reaction counter skinned as
  SNR bars instead of a plain view count, fitting the SDR theme. One
  increment per browser session per post (`sessionStorage`-deduped), via
  `POST /api/signal/<slug>`.
- **Guestbook** — a KV-backed public form (name optional, message
  required, 280 chars) via `POST /api/guestbook`. Anti-abuse, cheapest
  check first: a hidden honeypot field, then Cloudflare Turnstile
  (verified server-side against `siteverify`, see `verifyTurnstile()` in
  `src/index.js`), then a 60-second per-IP cooldown (Cloudflare KV's own
  minimum TTL). Turnstile needs `TURNSTILE_SECRET_KEY` set as a Worker
  secret — see Deploy. Without it, Turnstile verification is skipped
  (honeypot + rate limit still apply), so local dev doesn't need it
  configured. No auth, no moderation UI — it's a personal-site guestbook,
  not a production comment system; keep that in mind before linking it
  anywhere with real traffic.

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

Two manual, one-time steps: `wrangler.jsonc`'s `kv_namespaces` entry needs
a real namespace ID before that deploy will succeed, and the guestbook's
Turnstile check needs a `TURNSTILE_SECRET_KEY` Worker secret — see
DEPLOY.md.
