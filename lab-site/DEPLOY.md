# Deploying to Cloudflare Pages

This is a static site with no build step, so the Cloudflare Pages setup is
about as simple as it gets.

## 1. Push this to a GitHub (or GitLab) repo

```bash
cd lab-site
git init
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

(Create the empty repo on GitHub first, without a README/license, so
there's nothing to conflict with the initial push.)

## 2. Connect the repo in Cloudflare

1. Log into the Cloudflare dashboard.
2. In the left sidebar: **Workers & Pages** → **Create** → **Pages** tab →
   **Connect to Git**.
3. Authorize Cloudflare's GitHub app if you haven't already, and pick this
   repo.
4. Build settings — this is the part that trips people up on a no-build
   site, so set it exactly like this:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `lab-site` (the site lives in this
     subdirectory of the repo, not the repo root)
5. Click **Save and Deploy**. First deploy takes under a minute.

You'll get a `<project-name>.pages.dev` URL immediately — that's live and
usable right away, domain or not.

## 3. Point your own domain at it (optional, whenever you're ready)

1. In the Pages project, go to **Custom domains** → **Set up a custom
   domain**.
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

## Rollbacks

Pages keeps every deployment. If a push breaks something: Pages project →
**Deployments** → find the last good one → **Rollback to this
deployment**. No git revert needed for a quick fix.
