# Posts

Each entry in `data/posts.json` needs a matching markdown file here, named
`<slug>.md`. The site fetches it client-side and renders it with `marked.js`
(loaded via CDN in `index.html`) when someone opens `#post/<slug>`.

No frontmatter — title, date, tags, and summary all live in `data/posts.json`.
Just write the post body as plain markdown, starting with an `# H1` title.
