# Showcase — Full MVP (Batches 1–5)

An AI-powered website design discovery platform: designers submit a URL,
AI captures and tags it, visitors discover/save/follow, and admins
moderate — the complete loop from the original 5-batch plan.

**Ready to actually put this live?** See `DEPLOYMENT.md` for a concrete,
step-by-step guide (Vercel + Railway/Render + Cloudflare R2).

- **Batch 1** — accounts, profiles, manual submission
- **Batch 2** — AI-automated submission (URL → screenshots + AI-generated
  category/tags/colors/description for review before publishing)
- **Batch 3** — paginated gallery, tag-aware search, tag filtering, hover
  interactions, tabbed desktop/tablet/mobile screenshot viewer
- **Batch 4** — follow designers, a Saved page, "You might also like",
  "Picked for you" — scoped to skip full multi-collection folders per the
  original plan's own MVP-cut recommendation
- **Batch 5** — admin dashboard, AI moderation flagging, trending
  algorithm, image thumbnails, basic SEO, rate limiting, Alembic migrations

## What's here

**Backend** — FastAPI + SQLAlchemy + JWT auth
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Users: `GET/PUT /api/users/{username}`, `GET /api/users/{username}/designs`,
  `POST /api/users/{username}/follow`, `GET .../followers`, `GET .../following`
- Designs: `GET/POST /api/designs`, `GET/PUT/DELETE /api/designs/{id or slug}`,
  `POST .../like`, `POST .../save`, `POST .../view`
- Discovery: `GET /api/designs/meta/{categories,saved,recommended,trending}`,
  `GET /api/designs/{slug}/similar`
- Batch 2: `POST /api/upload`, `POST /api/capture/analyze`
- Batch 5 admin (all require an admin account, see setup below):
  `GET /api/admin/designs?status=`, `PUT .../approve`, `PUT .../reject`,
  `PUT .../feature`, `DELETE /api/admin/designs/{id}`,
  `GET /api/admin/users`, `PUT /api/admin/users/{id}/suspend`

**Frontend** — Next.js 14 (App Router) + Tailwind
`/`, `/explore`, `/search`, `/design/[slug]`, `/designer/[username]`,
`/submit`, `/saved`, `/admin`, `/login`, `/signup`

**Database** — SQLite by default (zero setup), Alembic migrations, optional
Postgres via `docker-compose.yml`.

## Quickstart

### 1. Backend

Requires **Python 3.11 or 3.12** (3.13/3.14 aren't fully supported by all
dependencies yet — some don't ship prebuilt Windows wheels, causing local
compilation errors during `pip install`).

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Windows (PowerShell):
```powershell
cd backend
py -3.12 -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Upgrading from an earlier batch with an existing `showcase.db`?** Batch 5
added new columns (moderation, featured, view counts, suspension) that
`create_all` — the mechanism earlier batches relied on — won't retroactively
add to existing tables. Delete your local `showcase.db` and start fresh (it's
just your own test data), then run `alembic upgrade head` to create the
current schema. Going forward, `alembic upgrade head` is the right way to
apply schema changes without losing data. New/fresh setups: `create_all`
(still run automatically on `uvicorn` startup) and `alembic upgrade head`
produce the identical schema, so either works — but only Alembic supports
incrementally upgrading a database that already has data in it.

**`playwright install chromium`** downloads the browser binary (~150–300MB)
— one-time, separate from `pip install`, needs internet access.

Using Postgres instead of SQLite? Also run
`pip install -r requirements-postgres.txt`.

**AI analysis (optional).** Without `ANTHROPIC_API_KEY` in `.env`, capture
still works (screenshots + domain-derived title) but skips AI category/tag/
color/description/moderation generation.
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Admin access.** Sign up normally through `/signup`, then add your
username to `.env` and restart the backend:
```
ADMIN_USERNAMES=yourname
```
An "Admin" link appears in the nav once you're logged in as that user. The
old `scripts/approve_design.py` still works as a headless fallback, but the
`/admin` dashboard is now the intended way to moderate submissions.

API docs at http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

App at http://localhost:3000

### 3. Try the full loop

1. Sign up, add yourself as admin in `backend/.env` (`ADMIN_USERNAMES`),
   restart the backend.
2. `/submit` → enter a URL → **Analyze Website**. Review the AI-filled
   fields (or fill manually if no API key is set) → submit.
3. Go to `/admin` → **Pending** tab → see your submission, with an
   AI moderation badge (✓ AI-checked or ⚠️ Flagged) → **Approve**.
4. It's now live on `/explore`. Open it — the design page has real `<title>`
   and Open Graph tags now (view page source / share the link to check).
5. Like a few designs, save some, follow a designer — check `/saved`,
   "Picked for you" on the homepage, and "You might also like" on any
   design page.
6. Homepage's **Trending** section now reflects actual engagement
   (likes/saves/views, recency-weighted) instead of just newest-first.
7. Back in `/admin`, try **Feature**, **Reject**, **Suspend** on a test
   user (not yourself — that's blocked), and confirm a suspended account
   can't log in.

## On AI moderation

The moderation flag piggybacks on the same vision call from Batch 2 (one
extra field in the same JSON response) rather than a second API call, so it
costs nothing extra. It's advisory, not a hard gate — every submission
still lands in the pending queue regardless of the flag; the flag just
helps an admin triage what to look at first. This matches the original
plan's own framing: "the goal is to reduce manual moderation, not
eliminate humans." Manual uploads (not run through Analyze Website) don't
get a moderation flag at all — shown as neither badge in `/admin`.

## On the trending algorithm

`score = (likes×2 + saves×4 + views×0.1) / (1 + age_in_days)` — the plan's
suggested weights, plus a simple recency decay so one old viral design
doesn't permanently camp at #1. View counts come from a dedicated
`POST /designs/{id}/view` the frontend fires once client-side after a
design page actually renders in a browser — deliberately **not** tied to
the `GET /designs/{slug}` endpoint, which is also hit by `generateMetadata`
for SEO tags and by any crawler, neither of which is a real visitor (see
testing notes below for why this matters).

## On the similarity/recommendation logic

"You might also like" and "Picked for you" use a tag/category-overlap
heuristic, not real AI embeddings — scored by shared tags plus same
category, falling back to recent designs when there isn't enough overlap.
Good MVP substitute for the embeddings-based version the original plan
describes; natural upgrade path if you want to go further: embed each
design's AI-written description, store it in a vector column (pgvector),
swap the tag-overlap scoring for a nearest-neighbor query.

## A bug I caught and fixed while testing this batch

Adding `generateMetadata` for SEO meant two independent server-side calls
to `GET /designs/{slug}` per page load (metadata + the page component). I
initially assumed Next.js's automatic fetch request-memoization would
dedupe these — that's the documented behavior — and wrote a comment
claiming it was "verified." Then I actually measured `view_count`
before/after a single real page load instead of trusting the assumption,
and it had gone up by 2, not 1. The memoization didn't apply here (likely
because the route is marked `force-dynamic`, which seems to affect more
than just the data cache). Rather than fight that, I moved view-counting
off the GET endpoint entirely onto a dedicated `POST /designs/{id}/view`
that only the browser fires, client-side, after the page renders —
verified with the same before/after measurement, now showing exactly +1
per real view and +0 for repeated `GET /designs/{slug}` calls regardless
of count. This is arguably a better design anyway, not just a bug fix:
trending no longer counts SEO-crawler and metadata-generation hits as
"views."

## A known UI limitation, unchanged since Batch 1

Server-rendered pages (design detail, designer profile) fetch without an
auth token, so `liked_by_me`/`saved_by_me`/`followed_by_me` always start
`false` on first load even if you already liked/saved/followed — buttons
show correct state after one click or a client refetch. Not fixed in this
batch; worth a client-side state refresh on mount if it bothers you.

## A tradeoff from Batch 3, still true

Explore and Search fetch their design grid client-side (for "Load More"
without a full reload), so those two pages render an empty shell to a
crawler that doesn't execute JS. The homepage and individual design pages
— the ones actually worth indexing/sharing — are fully server-rendered
with real metadata now. Explore/Search's SEO would need a further pass
(server-rendered first page + client-fetched subsequent pages, or a `page`
URL param) if that matters for your launch.

## A note on testing

Everything in this batch was run and verified end-to-end, not just unit
tested: full admin authorization flow (regular user blocked with 403,
admin can approve/reject/feature/delete, suspended users blocked from both
login and using an existing token); trending score math confirmed against
hand-computed expected values including recency decay; rate limiting
confirmed to actually 429 on the Nth call; thumbnail generation confirmed
to produce correctly-sized WebP files; moderation field parsing including
invalid-value and malformed-JSON edge cases; the view-count double-counting
bug described above, caught by empirical measurement rather than
assumption; Alembic's autogenerated migration applied to a fresh database
and the app confirmed working against the migration-created schema (not
just `create_all`); real backend + frontend servers together confirmed
SEO meta tags, trending homepage, and the admin page shell all render
correctly. Playwright/Anthropic live calls remain untested from this side
— this sandbox's network is restricted to package registries, not
arbitrary websites or api.anthropic.com — same limitation noted since
Batch 2.

## What's still not here (beyond this MVP's scope)

- Real embeddings-based similarity (heuristic tag-overlap is used instead,
  with the upgrade path noted above)
- Full multi-collection folders (single Saved list only)
- Redis-backed rate limiting (current limiter is in-memory, single-process
  only — fine for one backend instance, not for a load-balanced deployment;
  see `DEPLOYMENT.md`'s closing note)
- CDN in front of R2/S3 (works fine without one; a custom domain + CDN is
  a `DEPLOYMENT.md` "nice to have," not required to launch)
- AI quality scoring (the original plan mentions this as optional/internal-
  only; skipped entirely here as genuinely low-value for an MVP)

## Notes on architecture decisions

- **Storage**: `backend/app/storage.py` supports two backends via
  `STORAGE_BACKEND` — `local` (disk, zero-config, default) or `s3`
  (AWS S3 / Cloudflare R2, via boto3). Both were tested — local with a
  real save/thumbnail round-trip, s3 with a mocked boto3 client verifying
  the right bucket/content-type/URL construction, including the R2
  endpoint-override case and the "no custom domain" fallback URL. See
  `DEPLOYMENT.md` for the full production setup — **do not deploy with the
  local backend**, most PaaS platforms wipe the filesystem on every
  redeploy.
- **Auth**: JWT bearer tokens in `localStorage`. Fine for an MVP; consider
  httpOnly cookies before handling sensitive data at scale.
- **Admin**: config-driven (`ADMIN_USERNAMES` env var), not a database
  column — granting/revoking admin access is a restart, never a migration.
- **DB**: SQLite for zero-setup local dev; SQLAlchemy models work unchanged
  against Postgres — just point `DATABASE_URL` at it. Alembic migrations
  now track schema changes going forward.
