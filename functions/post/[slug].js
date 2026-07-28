// Cloudflare Pages Function — runs at the edge for /post/<slug> requests.
//
// The site is a client-side SPA (index.html fetches data/posts.json and
// renders the body in the browser), so without this, every shared post
// link previews as the generic homepage title/description on Slack,
// Discord, Twitter, etc. This intercepts the request, looks up the real
// post metadata, and rewrites the <title>/OG/Twitter tags in index.html
// before it reaches the crawler — the client-side render is untouched.
export async function onRequestGet(context) {
  const { request, env } = context;
  const { slug } = context.params;
  const url = new URL(request.url);

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
}
