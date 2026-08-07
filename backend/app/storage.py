"""
Storage abstraction for uploaded screenshots.

Two backends, chosen by STORAGE_BACKEND in .env:

- "local" (default): saves to disk under UPLOAD_DIR, served via FastAPI's
  StaticFiles mount. Zero config, fine for local development — but the
  filesystem is ephemeral on most PaaS platforms (Railway, Render, etc.),
  meaning every screenshot vanishes on the next deploy/restart. Don't use
  this in production.

- "s3": uploads to an S3-compatible bucket (AWS S3, Cloudflare R2, etc.)
  via boto3. Required before a real production launch.

Everything above this module only ever calls save_bytes() / save_file() /
the _with_thumbnail variants and stores the URL string they return — no
other code needs to know or care which backend is active.
"""
import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.config import settings

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
THUMBNAIL_MAX_WIDTH = 600


# ---------------------------------------------------------------------
# Local disk backend
# ---------------------------------------------------------------------

UPLOAD_ROOT = Path(settings.upload_dir)
if settings.storage_backend == "local":
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def _save_bytes_local(data: bytes, ext: str, subdir: str) -> str:
    target_dir = UPLOAD_ROOT / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.{ext.lstrip('.')}"
    dest_path = target_dir / filename

    with open(dest_path, "wb") as out:
        out.write(data)

    return f"{settings.public_base_url}/static/uploads/{subdir}/{filename}"


# ---------------------------------------------------------------------
# S3-compatible backend (AWS S3, Cloudflare R2, etc.)
# ---------------------------------------------------------------------

_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        import boto3

        _s3_client = boto3.client(
            "s3",
            region_name=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url,  # None for AWS S3, set for R2
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
        )
    return _s3_client


_CONTENT_TYPES = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}


def _save_bytes_s3(data: bytes, ext: str, subdir: str) -> str:
    if not settings.s3_bucket:
        raise RuntimeError(
            "STORAGE_BACKEND=s3 but S3_BUCKET isn't set — check your .env. "
            "See README's deployment section for the full S3/R2 setup."
        )

    ext = ext.lstrip(".")
    key = f"{subdir}/{uuid.uuid4().hex}.{ext}"

    client = _get_s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=_CONTENT_TYPES.get(ext, "application/octet-stream"),
    )

    base = settings.s3_public_url_base or f"https://{settings.s3_bucket}.s3.amazonaws.com"
    return f"{base.rstrip('/')}/{key}"


# ---------------------------------------------------------------------
# Backend-agnostic public API
# ---------------------------------------------------------------------

def save_bytes(data: bytes, ext: str = "png", subdir: str = "designs") -> str:
    if settings.storage_backend == "s3":
        return _save_bytes_s3(data, ext, subdir)
    return _save_bytes_local(data, ext, subdir)


def save_file(file: UploadFile, subdir: str = "designs") -> str:
    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if f".{ext}" not in ALLOWED_EXTENSIONS:
        ext = "png"
    return save_bytes(file.file.read(), ext, subdir)


def _make_thumbnail_bytes(data: bytes) -> Optional[bytes]:
    """Resize to a fixed max width and re-encode as WebP for fast gallery
    loading. Returns None if the bytes aren't a readable image — callers
    treat that as 'no thumbnail available' rather than failing the upload."""
    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(data)).convert("RGB")
        if img.width > THUMBNAIL_MAX_WIDTH:
            ratio = THUMBNAIL_MAX_WIDTH / img.width
            img = img.resize((THUMBNAIL_MAX_WIDTH, int(img.height * ratio)))
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=80)
        return buf.getvalue()
    except Exception:
        return None


def save_bytes_with_thumbnail(data: bytes, ext: str = "png", subdir: str = "designs") -> tuple[str, Optional[str]]:
    """Save the original image plus a WebP thumbnail. Returns (original_url,
    thumbnail_url) — thumbnail_url is None if thumbnailing failed, which
    callers handle by just falling back to the original image in the UI."""
    original_url = save_bytes(data, ext, subdir)

    thumb_bytes = _make_thumbnail_bytes(data)
    if thumb_bytes is None:
        return original_url, None

    thumbnail_url = save_bytes(thumb_bytes, "webp", subdir=f"{subdir}/thumbs")
    return original_url, thumbnail_url


def save_file_with_thumbnail(file: UploadFile, subdir: str = "designs") -> tuple[str, Optional[str]]:
    ext = Path(file.filename or "").suffix.lstrip(".").lower() or "png"
    data = file.file.read()
    return save_bytes_with_thumbnail(data, ext, subdir)