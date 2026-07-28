# Deploying to production

This covers taking the app from `localhost` to a real, publicly reachable
deployment. Recommended stack (matches the original plan): **Vercel** for
the frontend, **Railway or Render** for the backend + Postgres, and
**Cloudflare R2** for screenshot storage (S3-compatible, no egress fees,
generous free tier — swap for AWS S3 if you prefer, the code supports both
identically).

I can't do this part for you — it requires your own accounts, API keys,
and billing — but every step below is concrete and in order.

## Before you start: the one thing you must not skip

**Do not deploy with `STORAGE_BACKEND=local`.** Railway, Render, and most
PaaS platforms wipe the container filesystem on every deploy and often on
every restart. With the local backend, every screenshot anyone has ever
uploaded disappears the first time you ship an update. Set up R2 or S3
(step 3 below) before you have real users, not after.

## 1. Push to GitHub

If you haven't already:
```bash
cd showcase-mvp
git init
git add .
git commit -m "Initial commit"
```
Create a repo on GitHub and push. Both Vercel and Railway/Render deploy
directly from a connected GitHub repo.

## 2. Backend — Railway or Render

Both work the same way here; pick whichever you prefer.

1. New project → deploy from your GitHub repo → set the **root directory**
   to `backend`.
2. Add a **Postgres** database from the platform's dashboard (both Railway
   and Render offer this as one click). Copy the connection string it gives
   you.
3. **Build command:**
   ```
   pip install -r requirements.txt -r requirements-postgres.txt -r requirements-s3.txt && playwright install --with-deps chromium
   ```
   (`--with-deps` installs the OS-level libraries Chromium needs — without
   it, Playwright will fail at runtime in most container images.)
4. **Start command:**
   ```
   alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
   Running the migration as part of startup means every deploy
   automatically brings the schema up to date — no manual step.
5. **Environment variables** (set these in the platform's dashboard, not
   in a committed `.env`):
   ```
   DATABASE_URL=<the Postgres connection string from step 2>
   SECRET_KEY=<generate a long random string>
   PUBLIC_BASE_URL=<your backend's public URL, e.g. https://showcase-api.up.railway.app>
   CORS_ORIGINS=<your frontend's URL, added in step 4 — comes back to this after>
   ANTHROPIC_API_KEY=<your key, if using AI features>
   ADMIN_USERNAMES=<your username>
   STORAGE_BACKEND=s3
   S3_BUCKET=<from step 3>
   S3_ENDPOINT_URL=<from step 3>
   S3_ACCESS_KEY_ID=<from step 3>
   S3_SECRET_ACCESS_KEY=<from step 3>
   S3_PUBLIC_URL_BASE=<from step 3>
   ```
6. Deploy. Check `https://<your-backend-url>/api/health` returns
   `{"status": "ok"}` and `https://<your-backend-url>/docs` loads.

## 3. Storage — Cloudflare R2

1. Cloudflare dashboard → R2 → create a bucket (e.g. `showcase-uploads`).
2. R2 → **Manage R2 API tokens** → create a token with read/write access to
   that bucket. Copy the **Access Key ID** and **Secret Access Key** —
   shown once, save them now.
3. Your **endpoint URL** is `https://<account-id>.r2.cloudflarestorage.com`
   (account ID is in the R2 dashboard sidebar).
4. For public access, either:
   - Enable the bucket's public R2.dev URL (Settings → Public Access) and
     use that as `S3_PUBLIC_URL_BASE`, or
   - Connect a custom domain to the bucket (Settings → Custom Domains) for
     a cleaner URL — recommended before a real launch.
5. Plug all of this into the backend env vars from step 2.

(Using AWS S3 instead: create a bucket, an IAM user scoped to that bucket
with `PutObject`/`GetObject`, leave `S3_ENDPOINT_URL` unset, and either use
the bucket's default public URL or put CloudFront in front of it for
`S3_PUBLIC_URL_BASE`.)

## 4. Frontend — Vercel

1. New project → import the same GitHub repo → set the **root directory**
   to `frontend`. Vercel auto-detects Next.js; no build command changes
   needed.
2. Environment variable:
   ```
   NEXT_PUBLIC_API_URL=<your backend's public URL from step 2>
   ```
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately; add a custom
   domain later from the project settings if you want one.

## 5. Close the loop

Go back to the backend's environment variables (step 2) and set:
```
CORS_ORIGINS=https://<your-vercel-url>
```
Redeploy the backend. Without this, the frontend's requests will be
blocked by CORS the moment it's not running on `localhost` anymore.

## 6. Verify the real thing works

1. Visit your Vercel URL. Sign up, submit a design via **Analyze Website**,
   confirm screenshots actually appear (this is the R2/S3 check — if this
   works, storage is correctly wired).
2. Log in as your admin account, approve it from `/admin`.
3. Confirm it shows up in `/explore`, and that the design detail page has
   a real `<title>` when you view source (SEO check).
4. Redeploy the backend once (push any trivial change) and confirm the
   screenshot from step 1 is *still there* afterward — this is the actual
   test that storage survived a redeploy, which is the whole point of not
   using the local backend in production.

## Things worth doing before real traffic, not covered above

- **Custom domain + HTTPS** — both Vercel and Railway/Render handle this
  for you once you add a domain in their dashboards; no code changes.
- **Error monitoring** — Sentry has free tiers for both Next.js and FastAPI
  and is a quick add if you want visibility into production errors.
- **Backups** — enable automatic Postgres backups in whichever platform
  you chose; both offer this as a checkbox, not a build.
- **Rate limiting beyond capture** — the in-memory limiter in
  `capture.py` only protects one endpoint and only within a single
  process. If you scale the backend to multiple instances, it stops being
  accurate (each instance tracks its own counts). Fine for a single-instance
  launch; revisit with a Redis-backed limiter if you outgrow that.
