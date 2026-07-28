// Worker entry point (deployed via `npx wrangler deploy`, the project's
// configured build command — see wrangler.jsonc). The site is a static SPA
// served from the `assets` binding; every request that matches a real file
// (index.html, assets/*, data/*.json, posts/*.md) is served directly by
// Cloudflare without ever reaching this script. This only runs as a
// fallback for paths with no matching static file — currently just
// /post/<slug>, so shared links preview with that post's real title and
// summary instead of the generic homepage (the client-side router can't do
// this itself: it only sees the URL after the HTML has already loaded and
// a crawler has already read the <head>).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/post\/([^/]+)\/?$/);

    if (!match) {
      return env.ASSETS.fetch(request);
    }

    const slug = decodeURIComponent(match[1]);

    const [pageRes, postsRes] = await Promise.all([
      env.ASSETS.fetch(new URL("/index.html", url)),
      env.ASSETS.fetch(new URL("/data/posts.json", url)),
    ]);

    if (!pageRes.ok) return pageRes;

    let post = null;
    if (postsRes.ok) {
      try {
        const posts = await postsRes.json();
        post = Array.isArray(posts) ? posts.find((p) => p.slug === slug) : null;
      } catch (err) {
        post = null;
      }
    }

    if (!post) return pageRes;

    const title = post.title + " — REDZOMBI LABS";
    const description = post.summary || "";
    const pageUrl = url.origin + "/post/" + encodeURIComponent(slug);

    const rewriter = new HTMLRewriter()
      .on("title", { element(el) { el.setInnerContent(title); } })
      .on('meta[name="description"]', { element(el) { el.setAttribute("content", description); } })
      .on('link[rel="canonical"]', { element(el) { el.setAttribute("href", pageUrl); } })
      .on('meta[property="og:type"]', { element(el) { el.setAttribute("content", "article"); } })
      .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", post.title); } })
      .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", description); } })
      .on('meta[property="og:url"]', { element(el) { el.setAttribute("content", pageUrl); } })
      .on('meta[name="twitter:title"]', { element(el) { el.setAttribute("content", post.title); } })
      .on('meta[name="twitter:description"]', { element(el) { el.setAttribute("content", description); } });

    return rewriter.transform(pageRes);
  },
};
