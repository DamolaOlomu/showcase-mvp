from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user, get_current_user_optional
from app.database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


def _bulk_follow_counts(db: Session, user_ids: list[str]) -> dict[str, tuple[int, int]]:
    """Returns {user_id: (follower_count, following_count)} for a batch of
    users in two GROUP BY queries total, instead of 2 queries per user."""
    if not user_ids:
        return {}
    counts: dict[str, list[int]] = {uid: [0, 0] for uid in user_ids}

    follower_rows = (
        db.query(models.Follow.followed_id, func.count(models.Follow.id))
        .filter(models.Follow.followed_id.in_(user_ids))
        .group_by(models.Follow.followed_id)
        .all()
    )
    for uid, count in follower_rows:
        counts[uid][0] = count

    following_rows = (
        db.query(models.Follow.follower_id, func.count(models.Follow.id))
        .filter(models.Follow.follower_id.in_(user_ids))
        .group_by(models.Follow.follower_id)
        .all()
    )
    for uid, count in following_rows:
        counts[uid][1] = count

    return {uid: (c[0], c[1]) for uid, c in counts.items()}


def serialize_users(
    users: list[models.User], db: Session, current_user: Optional[models.User]
) -> list[schemas.UserPublic]:
    """Bulk version of serialize_user — use for any endpoint returning a
    list of users (followers, following, etc.)."""
    user_ids = [u.id for u in users]
    counts = _bulk_follow_counts(db, user_ids)

    followed_ids: set = set()
    if current_user and user_ids:
        followed_ids = {
            row[0]
            for row in db.query(models.Follow.followed_id)
            .filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id.in_(user_ids))
            .all()
        }

    results = []
    for u in users:
        follower_count, following_count = counts.get(u.id, (0, 0))
        out = schemas.UserPublic.model_validate(u)
        out.follower_count = follower_count
        out.following_count = following_count
        out.followed_by_me = u.id in followed_ids
        results.append(out)
    return results


def serialize_user(
    user: models.User, db: Session, current_user: Optional[models.User]
) -> schemas.UserPublic:
    return serialize_users([user], db, current_user)[0]


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

    followers = (
        db.query(models.User)
        .join(models.Follow, models.Follow.follower_id == models.User.id)
        .filter(models.Follow.followed_id == user.id)
        .all()
    )
    return serialize_users(followers, db, current_user)


@router.get("/{username}/following", response_model=list[schemas.UserPublic])
def get_following(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    following = (
        db.query(models.User)
        .join(models.Follow, models.Follow.followed_id == models.User.id)
        .filter(models.Follow.follower_id == user.id)
        .all()
    )
    return serialize_users(following, db, current_user)


@router.get("/{username}/designs", response_model=list[schemas.DesignOut])
def get_user_designs(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    from app.routers.designs import serialize_designs, _design_base_query  # avoid circular import at module load

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    designs = (
        _design_base_query(db)
        .filter(models.Design.user_id == user.id, models.Design.status == models.DesignStatus.approved)
        .order_by(models.Design.created_at.desc())
        .all()
    )
    return serialize_designs(designs, db, current_user)
