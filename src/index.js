// Worker entry point (deployed via `npx wrangler deploy`, the project's
// configured build command — see wrangler.jsonc). The site is a static SPA
// served from the `assets` binding; every request that matches a real file
// (index.html, assets/*, data/*.json, posts/*.md) is served directly by
// Cloudflare without ever reaching this script. Everything below only runs
// as a fallback for paths with no matching static file: /post/<slug> (for
// per-post social previews) and the /api/* routes backing the signal meter
// and guestbook, both stored in the LAB_KV namespace.
const GUESTBOOK_KEY = "guestbook:entries";
const GUESTBOOK_MAX_ENTRIES = 50;
const GUESTBOOK_MAX_MESSAGE = 280;
const GUESTBOOK_MAX_NAME = 40;
const GUESTBOOK_RATE_LIMIT_SECONDS = 60; // Cloudflare KV's minimum TTL

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const postMatch = url.pathname.match(/^\/post\/([^/]+)\/?$/);
    if (postMatch) return handlePost(request, env, url, decodeURIComponent(postMatch[1]));

    const signalMatch = url.pathname.match(/^\/api\/signal\/([^/]+)\/?$/);
    if (signalMatch) return handleSignal(request, env, decodeURIComponent(signalMatch[1]));

    if (url.pathname === "/api/guestbook") return handleGuestbook(request, env);

    return env.ASSETS.fetch(request);
  },
};

async function handlePost(request, env, url, slug) {
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

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json" },
  });
}

async function handleSignal(request, env, slug) {
  const key = "signal:" + slug;

  if (request.method === "GET") {
    const count = parseInt((await env.LAB_KV.get(key)) || "0", 10);
    return json({ slug: slug, count: count });
  }

  if (request.method === "POST") {
    const count = parseInt((await env.LAB_KV.get(key)) || "0", 10) + 1;
    await env.LAB_KV.put(key, String(count));
    return json({ slug: slug, count: count });
  }

  return json({ error: "method not allowed" }, 405);
}

async function handleGuestbook(request, env) {
  if (request.method === "GET") {
    const entries = await readGuestbook(env);
    return json({ entries: entries });
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return json({ error: "malformed request" }, 400);
    }

    // honeypot — bots that fill every field get a fake success, no write
    if (body.website) {
      const entries = await readGuestbook(env);
      return json({ entries: entries });
    }

    const message = String(body.message || "").trim().slice(0, GUESTBOOK_MAX_MESSAGE);
    const name = String(body.name || "").trim().slice(0, GUESTBOOK_MAX_NAME) || "anonymous";

    if (!message) {
      return json({ error: "message can't be empty" }, 400);
    }

    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitKey = "guestbook:rate:" + ip;
    if (await env.LAB_KV.get(rateLimitKey)) {
      return json({ error: "slow down — try again in a bit" }, 429);
    }
    await env.LAB_KV.put(rateLimitKey, "1", { expirationTtl: GUESTBOOK_RATE_LIMIT_SECONDS });

    const entries = await readGuestbook(env);
    entries.unshift({
      name: name,
      message: message,
      date: new Date().toISOString().slice(0, 10),
    });
    const trimmed = entries.slice(0, GUESTBOOK_MAX_ENTRIES);
    await env.LAB_KV.put(GUESTBOOK_KEY, JSON.stringify(trimmed));

    return json({ entries: trimmed });
  }

  return json({ error: "method not allowed" }, 405);
}

async function readGuestbook(env) {
  try {
    const raw = await env.LAB_KV.get(GUESTBOOK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}
