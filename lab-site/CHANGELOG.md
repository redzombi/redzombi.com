# Changelog

All notable changes to the site itself (not the /log content — that lives
in `data/log.json` and is a different kind of log).

## [Unreleased]

## 2026-07-28 — Terminal easter eggs, signal meter, guestbook

- **Command palette easter eggs**: `whoami`, `sudo`, `neofetch`, and
  `cat log.json`, rendered inline in the palette instead of `alert()`.
  Added a Konami code (↑↑↓↓←→←→BA) triggering a matrix-rain canvas effect.
- **Signal meter** on each post: a KV-backed view counter skinned as SNR
  bars instead of a plain number. One increment per session per post.
  New routes: `GET`/`POST /api/signal/<slug>`.
- **Guestbook**: a KV-backed public form on the homepage (name optional,
  message required). Anti-abuse layers, cheapest first: a honeypot field,
  then Cloudflare Turnstile (verified server-side against `siteverify`),
  then a 60s per-IP cooldown. No auth or moderation UI — it's a toy, not a
  comment system. New routes: `GET`/`POST /api/guestbook`.
- Added a `TURNSTILE_SECRET_KEY` Worker secret (not committed — set via
  `wrangler secret put`) backing the guestbook's captcha check. Verified
  the rejection path against Cloudflare's real `siteverify` endpoint with
  a bogus token before shipping; skips verification entirely if the secret
  isn't set, so local dev doesn't need it configured.
- Added a `LAB_KV` namespace binding to `wrangler.jsonc` backing the two
  features above — needs a real namespace ID before deploy; see
  `lab-site/DEPLOY.md`.
- **Reverted a live Terra Command hero widget** (client-side fetch to
  `terra.redzombi.com/data/aircraft.json`) shipped earlier the same day —
  that hub isn't public yet and is about to be replaced, so nothing should
  link to it. Also dropped the `url`/`linkLabel` on the Zombi Terra Command
  project card in `data/projects.json` for the same reason; re-add both
  once the new hub is actually ready to be public.

## 2026-07-27 — Real post URLs, per-post social previews, syntax highlighting

- **Replaced hash-based post routing (`#post/<slug>`) with real paths**
  (`/post/<slug>`). Added `<base href="/">` so relative asset/data URLs keep
  resolving correctly from a `/post/...` path. Old hash links redirect to
  the new URL client-side.
- **Added `src/index.js`, a Cloudflare Worker**, plus a committed
  `wrangler.jsonc` at the repo root. `/post/<slug>` has no matching static
  file, so it falls through to the Worker, which looks up the post and
  rewrites the `<title>`/OG/Twitter tags before the HTML reaches a
  crawler — shared links now preview with the real post title and summary
  instead of the generic homepage blurb. Every other path is served
  directly from `lab-site/` and never touches the Worker.
  (Two false starts before this: first as a Cloudflare Pages Function,
  which doesn't apply here since this project deploys as a git-connected
  Worker running `npx wrangler deploy`, not classic Pages; then in the
  wrong directory. See `README.md` and `DEPLOY.md` for the actual deploy
  model.)
- **Added syntax highlighting** for fenced code blocks in posts via
  `highlight.js` (CDN, same low-friction pattern as `marked.js`). Styled
  with the site's own CSS variables instead of a stock theme, so it follows
  CRT/PRINT automatically.

## 2026-07-23 — Code review pass: palette, boot cleanup, theming, meta tags

- **Fixed command palette Enter/hover mismatch.** Hovering a result
  highlighted it via `.selected`, but Enter always activated the
  literal first DOM result regardless of what was highlighted. Now
  tracks a single `paletteSelectedIndex` that both hover and Enter
  read from.
- **Added arrow-key navigation to the command palette** (Up/Down cycle
  through results, wrapping at both ends, scrolling the active item
  into view) — previously keyboard users could only reach the first
  result.
- **Boot sequence no longer leaks its typewriter interval.** Dismissing
  it early (keypress/click) didn't `clearInterval`, so the message
  typing kept running in the background for its full ~560ms regardless.
- **Removed the now-redundant boot-close listeners.** The real bug
  (see below) was a CSS specificity issue, not the event listeners —
  once that was fixed, the earlier belt-and-suspenders attempt
  (`document`/`window` keydown, `document`/button click, four
  listeners total) was dead weight. Trimmed to one `document` keydown
  and one `document` click, which cover the whole page including the
  button.
- **Themed the custom `>_` cursor.** It was hardcoded to the CRT
  accent red regardless of theme — now switches to the PRINT accent
  in light mode, matching every other themed color on the site.
- **Added `type="button"` to the boot-skip button** — harmless today
  with no `<form>` present, but defensive against future changes.
- **Added Open Graph / Twitter Card meta tags + canonical link** —
  this site had none, unlike Terra which already has them. No og:image
  yet since there's no raster asset for one (favicon.svg is the only
  image asset in `assets/img/`).

## 2026-07-23 — Boot screen fix, first project entries

- **Fixed the boot sequence and command palette never closing.**
  `.boot-sequence` and `.palette` both forced `display: flex`
  unconditionally, which beat the browser's default `[hidden] { display:
  none }` rule by CSS specificity — `main.js` was correctly setting
  `el.hidden = true` on keypress/click, but it had no visual effect.
  Added a global `[hidden] { display: none !important; }` rule.
- Added the first two `projects` entries: **Zombi Terra Command** (live
  ADS-B/UAT signals hub, v1.5 SDR expansion in progress) and **Zombi
  Orbit Command** (satellite-tracking companion project, early stages).
- Hero status line now reflects real content counts instead of a
  hardcoded "STATUS: EMPTY" — shows project/post/log counts once
  anything's published.

## 2026-07-22 — Relaunch as REDZOMBI LABS

- Full reskin: radar/ops-deck theme replaced with a terminal/CRT identity
  (red-on-black) and a brutalist PRINT (paper/dot-matrix) light mode.
- Restructured content model: `modules` → `projects` (with idea/building/
  live/archived status), `notebook` → `log` (quick-dump feed), and a new
  `posts` feed for longform writing (markdown bodies in `posts/`, rendered
  client-side via `marked.js` from a CDN, hash-routed at `#post/<slug>`).
- New favicon, rewritten README/DEPLOY docs to match.

## 2026-07-20 — Initial scaffold

- Base structure: header/bezel, hero with radar sweep, modules board,
  notebook feed, footer.
- Day (ops deck) / night (red-light ops) theming, auto via
  `prefers-color-scheme` with manual override toggle.
- Data-driven modules and notebook sections, both starting empty.
- README, DEPLOY guide, this changelog.
