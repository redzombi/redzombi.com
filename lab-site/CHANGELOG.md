# Changelog

All notable changes to the site itself (not the /log content — that lives
in `data/log.json` and is a different kind of log).

## [Unreleased]

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
