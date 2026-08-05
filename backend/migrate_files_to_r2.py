"""
One-time migration: upload local static/uploads files to R2 (or any
S3-compatible bucket), then rewrite the corresponding URL columns in
Postgres so they point at the new public bucket URL instead of
http://localhost:8001/...

Run from backend/, with venv active, AFTER:
- .env has STORAGE_BACKEND=s3 and all S3_* values filled in
- boto3 is installed
- the data migration (migrate_to_supabase.py) has already run

    python migrate_files_to_r2.py

Safe to re-run: uploads overwrite the same key (idempotent), and the
URL rewrite only touches rows that still contain the old localhost
prefix, so re-running after a partial failure won't double-rewrite.
"""

import mimetypes
from pathlib import Path

import boto3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import DesignImage

# --- Sanity checks -------------------------------------------------------

if settings.storage_backend != "s3":
    raise SystemExit("STORAGE_BACKEND is not 's3' in .env — set it before running this.")

if not settings.s3_bucket or not settings.s3_public_url_base:
    raise SystemExit("S3_BUCKET or S3_PUBLIC_URL_BASE missing from .env.")

OLD_PREFIX_CANDIDATES = [
    f"{settings.public_base_url.rstrip('/')}/static/uploads/",
    "http://localhost:8001/static/uploads/",
    "http://localhost:8000/static/uploads/",
]
NEW_PREFIX = settings.s3_public_url_base.rstrip("/") + "/"

LOCAL_ROOT = Path(settings.upload_dir)  # e.g. ./static/uploads

# --- Upload every local file, preserving folder structure ----------------

client = boto3.client(
    "s3",
    region_name=settings.s3_region,
    endpoint_url=settings.s3_endpoint_url,
    aws_access_key_id=settings.s3_access_key_id,
    aws_secret_access_key=settings.s3_secret_access_key,
)

uploaded = 0
skipped = 0

if not LOCAL_ROOT.exists():
    print(f"WARNING: {LOCAL_ROOT} does not exist locally — nothing to upload.")
else:
    for path in LOCAL_ROOT.rglob("*"):
        if not path.is_file():
            continue
        key = path.relative_to(LOCAL_ROOT).as_posix()  # e.g. captures/xyz.png
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        try:
            with open(path, "rb") as f:
                client.put_object(
                    Bucket=settings.s3_bucket,
                    Key=key,
                    Body=f.read(),
                    ContentType=content_type,
                )
            uploaded += 1
        except Exception as e:
            print(f"FAILED to upload {key}: {e}")
            skipped += 1

print(f"\nUploaded {uploaded} files to R2 bucket '{settings.s3_bucket}' ({skipped} failed)")

# --- Rewrite DB URLs -------------------------------------------------------

pg_engine = create_engine(settings.database_url)
PgSession = sessionmaker(bind=pg_engine)
db = PgSession()

rows = db.query(DesignImage).all()
updated = 0

for row in rows:
    changed = False
    for field in ("original_url", "optimized_url", "thumbnail_url"):
        val = getattr(row, field)
        if not val:
            continue
        for old_prefix in OLD_PREFIX_CANDIDATES:
            if val.startswith(old_prefix):
                new_val = val.replace(old_prefix, NEW_PREFIX, 1)
                setattr(row, field, new_val)
                changed = True
                break
    if changed:
        updated += 1

db.commit()
print(f"Updated URL fields on {updated} DesignImage rows (of {len(rows)} total)")

# --- Verification: print a few before/after-style samples ----------------

print("\n--- Sample of updated rows ---")
for row in db.query(DesignImage).limit(5).all():
    print(row.original_url, "|", row.thumbnail_url)

db.close()
print("\nDone. Spot-check a couple of these URLs in your browser to confirm they load.")