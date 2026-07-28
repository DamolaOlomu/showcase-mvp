import time
from collections import defaultdict
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from app import models
from app.ai_analysis import analyze_screenshot
from app.auth import get_current_user
from app.capture import capture_website, CaptureError
from app.config import settings
from app.storage import save_bytes_with_thumbnail

router = APIRouter(prefix="/api/capture", tags=["capture"])


class CaptureRequest(BaseModel):
    url: HttpUrl


def _fallback_title(url: str) -> str:
    domain = urlparse(url).netloc.replace("www.", "")
    name = domain.split(".")[0]
    return name.replace("-", " ").title() + " Website"


# Simple in-memory sliding-window rate limiter, keyed by user id. This is
# fine for a single-process dev/small deployment but resets on restart and
# doesn't coordinate across multiple backend instances — swap for a
# Redis-backed limiter (e.g. slowapi + Redis) before running this behind a
# load balancer with more than one instance.
_capture_calls: dict[str, list[float]] = defaultdict(list)


def check_capture_rate_limit(current_user: models.User = Depends(get_current_user)) -> models.User:
    now = time.time()
    window_start = now - 3600
    calls = [t for t in _capture_calls[current_user.id] if t > window_start]
    if len(calls) >= settings.capture_rate_limit_per_hour:
        raise HTTPException(
            status_code=429,
            detail=f"You've hit the limit of {settings.capture_rate_limit_per_hour} "
            "website analyses per hour. Try again later, or upload screenshots manually.",
        )
    calls.append(now)
    _capture_calls[current_user.id] = calls
    return current_user


@router.post("/analyze")
async def analyze(
    payload: CaptureRequest,
    current_user: models.User = Depends(check_capture_rate_limit),
):
    url = str(payload.url)

    try:
        shots = await capture_website(url)
    except CaptureError as e:
        raise HTTPException(status_code=400, detail=str(e))

    desktop_url, desktop_thumb = save_bytes_with_thumbnail(shots["desktop_full"], "png", subdir="captures")
    mobile_url, mobile_thumb = save_bytes_with_thumbnail(shots["mobile_full"], "png", subdir="captures")

    ai = analyze_screenshot(shots["desktop_viewport"])
    if not ai.get("title"):
        ai["title"] = _fallback_title(url)

    return {
        "images": [
            {"type": "desktop", "url": desktop_url, "thumbnail_url": desktop_thumb},
            {"type": "mobile", "url": mobile_url, "thumbnail_url": mobile_thumb},
        ],
        "ai": ai,
    }
