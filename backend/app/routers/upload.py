from fastapi import APIRouter, Depends, UploadFile, File

from app import models
from app.auth import get_current_user
from app.storage import save_file_with_thumbnail

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("")
def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    url, thumbnail_url = save_file_with_thumbnail(file, subdir="designs")
    return {"url": url, "thumbnail_url": thumbnail_url}
