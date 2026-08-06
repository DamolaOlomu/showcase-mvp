from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query

from app import models
from app.auth import get_current_user
from app.storage import save_file_with_thumbnail

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Whitelisted upload "kinds" mapped to their storage subdir. Keeping this as
# an explicit allow-list (rather than accepting an arbitrary subdir string
# from the client) prevents path traversal / writing into unexpected folders.
_KIND_SUBDIRS = {
    "design": "designs",
    "avatar": "avatars",
    "cover": "covers",
}


@router.post("")
def upload_image(
    file: UploadFile = File(...),
    kind: str = Query("design", description="One of: design, avatar, cover"),
    current_user: models.User = Depends(get_current_user),
):
    subdir = _KIND_SUBDIRS.get(kind)
    if subdir is None:
        raise HTTPException(status_code=400, detail=f"Invalid kind. Must be one of: {list(_KIND_SUBDIRS)}")

    url, thumbnail_url = save_file_with_thumbnail(file, subdir=subdir)
    return {"url": url, "thumbnail_url": thumbnail_url}
