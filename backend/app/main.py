import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth, users, designs, upload, capture, admin

# Batch 1: create tables directly from models. Swap for Alembic migrations
# once the schema stabilizes / before running against a shared Postgres.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Showcase API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Every /api/* response is live application state (designs, counts, profile
# fields) — never something a CDN or intermediate proxy should cache.
@app.middleware("http")
async def no_store_api_responses(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response


app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(designs.router)
app.include_router(upload.router)
app.include_router(capture.router)
app.include_router(admin.router)


@app.api_route("/api/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}