# Deploying to Cloudflare

This deploys as a Cloudflare Worker with static assets, not classic
Cloudflare Pages — the difference matters because it's what lets
`src/index.js` run at all (Pages' `functions/` directory convention
doesn't apply here; see the root `README.md`).

## 1. Push this to a GitHub (or GitLab) repo

```bash
git init
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## 2. Create the KV namespace (one-time, needed before first deploy)

The signal meter and guestbook store their data in a Cloudflare KV
namespace, referenced in `wrangler.jsonc` as `LAB_KV`. `wrangler deploy`
will fail until that binding points at a real namespace ID.

```bash
npx wrangler login
npx wrangler kv namespace create LAB_KV
```

That prints an `id`. Paste it into the `kv_namespaces` entry in the repo
root's `wrangler.jsonc`, replacing `REPLACE_WITH_KV_NAMESPACE_ID`, commit,
and push. (Equivalent dashboard path: **Workers & Pages** → **KV** →
**Create a namespace** — copy the Namespace ID it gives you.)

## 3. Set the Turnstile secret (one-time, needed for the guestbook captcha)

The guestbook's Cloudflare Turnstile check needs a secret key at runtime —
this one must NOT go in `wrangler.jsonc` (that's committed to git; secrets
never should be).

1. Create a Turnstile widget: Cloudflare dashboard → **Turnstile** →
   **Add site**. This gives you a **Site Key** (public — already in
   `lab-site/index.html`'s `data-sitekey`) and a **Secret Key**.
2. Set the secret key as a Worker secret:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   # paste the Secret Key when prompted
   ```

   (Equivalent dashboard path: the Worker → **Settings** → **Variables and
   Secrets** → **Add** → type **Secret**, name `TURNSTILE_SECRET_KEY`.)

If this isn't set, the guestbook still works — it just skips the Turnstile
check and relies on the honeypot + rate limit alone (see `README.md`).

## 4. Connect the repo in Cloudflare

1. Log into the Cloudflare dashboard.
2. In the left sidebar: **Workers & Pages** → **Create** → **Workers**
   tab → **Connect to Git** (not the Pages tab — this needs to be a
   git-connected Worker, so `npx wrangler deploy` runs on every push).
3. Authorize Cloudflare's GitHub app if you haven't already, and pick this
   repo.
4. Build settings:
   - **Deploy command:** `npx wrangler deploy`
   - **Build command:** *(leave blank — nothing to build)*
   - Everything else (Worker name, entry point, assets directory) comes
     from the committed `wrangler.jsonc` at the repo root. Don't rely on
     Cloudflare's auto-detected settings — without a committed config it
     re-guesses these on every build and silently ignores anything (like
     `src/index.js`) it doesn't already know how to wire up.
5. Click **Save and Deploy**. First deploy takes under a minute.

You'll get a `<worker-name>.<account>.workers.dev` URL immediately —
that's live and usable right away, domain or not.

## 5. Point your own domain at it (optional, whenever you're ready)

1. In the Worker's project, go to **Settings** → **Domains & Routes** →
   **Add** → **Custom Domain**.
2. Enter the domain or subdomain you want (e.g. `lab.yourdomain.com`).
3. If the domain's DNS is already on Cloudflare, it'll offer to add the
   CNAME automatically — accept it.
4. If the domain lives elsewhere, Cloudflare will show you the CNAME
   record to add at your current registrar/DNS host instead.
5. SSL provisions automatically; usually live within a few minutes, can
   take up to ~24h if DNS propagation is slow.

## Ongoing workflow

Every push to `main` auto-deploys. Cloudflare also builds a preview URL
for any other branch or PR, so you can stage changes (a new module, a
redesign pass) on a branch and check the preview link before merging.

## Verifying a deploy actually picked up your changes

Since there's no build step, a broken deploy usually means Cloudflare
silently used stale or auto-detected settings instead of the committed
config — not a build failure. After pushing, check the deployment's build
log (Cloudflare dashboard → the Worker → **Deployments** → latest entry)
for a line like:

```text
Executing user deploy command: npx wrangler deploy
```

If instead you see Wrangler asking about a `functions` directory or
printing "Detected Project Settings" before writing its own
`wrangler.jsonc`, the committed one isn't being picked up — the deploy
command or root directory in the dashboard settings doesn't match what's
described here.

## Rollbacks

Cloudflare keeps every deployment. If a push breaks something: the
Worker's project → **Deployments** → find the last good one →
**Rollback to this deployment**. No git revert needed for a quick fix.
