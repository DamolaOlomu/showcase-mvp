from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_current_user_optional
from app.database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


def serialize_user(
    user: models.User, db: Session, current_user: Optional[models.User]
) -> schemas.UserPublic:
    follower_count = db.query(models.Follow).filter(models.Follow.followed_id == user.id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user.id).count()
    followed_by_me = False
    if current_user:
        followed_by_me = (
            db.query(models.Follow)
            .filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id == user.id)
            .first()
            is not None
        )

    out = schemas.UserPublic.model_validate(user)
    out.follower_count = follower_count
    out.following_count = following_count
    out.followed_by_me = followed_by_me
    return out


@router.get("/{username}", response_model=schemas.UserPublic)
def get_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user, db, current_user)


@router.put("/{username}", response_model=schemas.UserPublic)
def update_user(
    username: str,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.username != username:
        raise HTTPException(status_code=403, detail="You can only edit your own profile")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user, db, current_user)


@router.post("/{username}/follow", response_model=schemas.UserPublic)
def toggle_follow(
    username: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = db.query(models.User).filter(models.User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't follow yourself")

    existing = (
        db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id == target.id)
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(models.Follow(follower_id=current_user.id, followed_id=target.id))

    db.commit()
    return serialize_user(target, db, current_user)


@router.get("/{username}/followers", response_model=list[schemas.UserPublic])
def get_followers(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    follower_ids = [
        f.follower_id for f in db.query(models.Follow).filter(models.Follow.followed_id == user.id).all()
    ]
    followers = db.query(models.User).filter(models.User.id.in_(follower_ids)).all() if follower_ids else []
    return [serialize_user(u, db, current_user) for u in followers]


@router.get("/{username}/following", response_model=list[schemas.UserPublic])
def get_following(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    following_ids = [
        f.followed_id for f in db.query(models.Follow).filter(models.Follow.follower_id == user.id).all()
    ]
    following = db.query(models.User).filter(models.User.id.in_(following_ids)).all() if following_ids else []
    return [serialize_user(u, db, current_user) for u in following]


@router.get("/{username}/designs", response_model=list[schemas.DesignOut])
def get_user_designs(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    from app.routers.designs import serialize_design  # avoid circular import at module load

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    designs = (
        db.query(models.Design)
        .filter(models.Design.user_id == user.id, models.Design.status == models.DesignStatus.approved)
        .order_by(models.Design.created_at.desc())
        .all()
    )
    return [serialize_design(d, db, current_user) for d in designs]
