# REDZOMBI LABS

A personal digital playground — quick thoughts, real posts, and whatever
project gets plugged in next. No roadmap, no deadline, no build step.
Static, deployed on Cloudflare Pages.

## Stack

Plain HTML/CSS/vanilla JS. No framework, no bundler, no `node_modules`.
Content lives in JSON files (and markdown for posts) and gets fetched
client-side. Edit, commit, push — Cloudflare Pages redeploys automatically.
The one external dependency is `marked.js`, loaded from a CDN in
`index.html` to render post markdown — same low-friction pattern as the
Google Fonts `@import` in the stylesheet.

## Structure

```text
lab-site/                     Cloudflare Pages build output directory — the
                               actual deployed site
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
  DEPLOY.md                    Cloudflare Pages connection steps
  CHANGELOG.md                 dev log for the site itself (not the /log — see below)
functions/
  post/[slug].js               Cloudflare Pages Function: injects per-post
                                title/OG/Twitter tags at the edge so shared
                                links preview correctly (see below). MUST live
                                here, at the repo root — Cloudflare finds
                                `functions/` relative to the project's *root
                                directory* (repo root, unchanged), which is a
                                separate setting from *build output directory*
                                (`lab-site`, what actually gets served). A
                                `lab-site/functions/` is invisible to Pages
                                and silently 404s.
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

Posts render at `/post/<slug>`. A Cloudflare Pages Function
(`functions/post/[slug].js`, at the **repo root**, not inside `lab-site/` —
see the note in Structure above) intercepts that path at the edge, looks up
the post in `data/posts.json`, and rewrites the page's `<title>`/OG/Twitter
tags to match before the client-side JS takes over and renders the body —
so shared links preview with the real title and summary instead of the
homepage's. No routing config needed beyond that file; Cloudflare Pages
auto-detects anything under the root-level `functions/`.

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

No build step needed, but you do need a local server (not `file://`,
since `fetch()` for the JSON/markdown won't work over the file protocol):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
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

See `DEPLOY.md` for connecting this repo to Cloudflare Pages. Short
version: no build command, output directory is `lab-site`.
