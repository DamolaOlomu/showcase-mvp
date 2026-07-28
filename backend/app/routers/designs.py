from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from slugify import slugify
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.ai_analysis import CATEGORIES
from app.auth import get_current_user, get_current_user_optional
from app.database import get_db

router = APIRouter(prefix="/api/designs", tags=["designs"])


def unique_slug(db: Session, title: str) -> str:
    base = slugify(title) or "design"
    slug = base
    i = 2
    while db.query(models.Design).filter(models.Design.slug == slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


def get_or_create_tags(db: Session, names: list[str]) -> list[models.Tag]:
    tags = []
    for raw in names:
        name = raw.strip().lower()
        if not name:
            continue
        tag = db.query(models.Tag).filter(models.Tag.name == name).first()
        if not tag:
            tag = models.Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def serialize_design(design: models.Design, db: Session, current_user: Optional[models.User]) -> schemas.DesignOut:
    like_count = db.query(models.Like).filter(models.Like.design_id == design.id).count()
    save_count = db.query(models.Save).filter(models.Save.design_id == design.id).count()
    liked_by_me = False
    saved_by_me = False
    if current_user:
        liked_by_me = db.query(models.Like).filter(
            models.Like.design_id == design.id, models.Like.user_id == current_user.id
        ).first() is not None
        saved_by_me = db.query(models.Save).filter(
            models.Save.design_id == design.id, models.Save.user_id == current_user.id
        ).first() is not None

    out = schemas.DesignOut.model_validate(design)
    out.like_count = like_count
    out.save_count = save_count
    out.liked_by_me = liked_by_me
    out.saved_by_me = saved_by_me
    return out


@router.get("/meta/categories", response_model=list[str])
def list_categories():
    return CATEGORIES


def _tag_ids(design: models.Design) -> set:
    return {t.id for t in design.tags}


@router.get("/meta/trending", response_model=list[schemas.DesignOut])
def get_trending_designs(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    limit: int = Query(12, ge=1, le=50),
):
    """Trending score = likes*2 + saves*4 + views*0.1, divided by (1 + age
    in days) so newer designs with the same engagement rank higher than
    stale ones — a simple recency decay rather than a pure engagement
    leaderboard that would let one old viral design camp at #1 forever."""
    designs = db.query(models.Design).filter(models.Design.status == models.DesignStatus.approved).all()

    now = datetime.utcnow()
    scored = []
    for d in designs:
        like_count = len(d.likes)
        save_count = len(d.saves)
        age_days = max((now - d.created_at).total_seconds() / 86400, 0)
        raw_score = like_count * 2 + save_count * 4 + (d.view_count or 0) * 0.1
        score = raw_score / (1 + age_days)
        scored.append((score, d))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = [d for _, d in scored[:limit]]
    return [serialize_design(d, db, current_user) for d in top]


@router.get("/meta/saved", response_model=list[schemas.DesignOut])
def get_saved_designs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    saves = (
        db.query(models.Save)
        .filter(models.Save.user_id == current_user.id)
        .order_by(models.Save.created_at.desc())
        .all()
    )
    designs = []
    for s in saves:
        d = db.query(models.Design).filter(models.Design.id == s.design_id).first()
        if d and d.status == models.DesignStatus.approved:
            designs.append(d)
    return [serialize_design(d, db, current_user) for d in designs]


@router.get("/meta/recommended", response_model=list[schemas.DesignOut])
def get_recommended_designs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    limit: int = Query(12, ge=1, le=50),
):
    """Heuristic 'picked for you': score approved designs by how many tags
    they share with designs this user has liked, excluding designs already
    liked. Falls back to filling with recent designs if there isn't enough
    signal yet (new users, or nobody's liked anything tag-diverse)."""
    liked = (
        db.query(models.Design)
        .join(models.Like, models.Like.design_id == models.Design.id)
        .filter(models.Like.user_id == current_user.id)
        .all()
    )
    liked_ids = {d.id for d in liked}
    liked_tag_ids: set = set()
    for d in liked:
        liked_tag_ids |= _tag_ids(d)

    candidates = (
        db.query(models.Design)
        .filter(models.Design.status == models.DesignStatus.approved)
        .all()
    )
    candidates = [c for c in candidates if c.id not in liked_ids]

    scored = [(len(liked_tag_ids & _tag_ids(c)), c) for c in candidates]
    scored = [(score, c) for score, c in scored if score > 0]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = [c for _, c in scored[:limit]]

    if len(top) < limit:
        exclude_ids = {c.id for c in top} | liked_ids
        filler = (
            db.query(models.Design)
            .filter(models.Design.status == models.DesignStatus.approved)
            .filter(~models.Design.id.in_(exclude_ids) if exclude_ids else True)
            .order_by(models.Design.created_at.desc())
            .limit(limit - len(top))
            .all()
        )
        top += filler

    return [serialize_design(d, db, current_user) for d in top]


@router.get("", response_model=schemas.DesignListOut)
def list_designs(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = db.query(models.Design).filter(models.Design.status == models.DesignStatus.approved)

    needs_tag_join = bool(tag) or bool(q)
    if needs_tag_join:
        query = query.outerjoin(models.Design.tags)

    if category:
        query = query.filter(models.Design.category == category)
    if tag:
        query = query.filter(models.Tag.name == tag.lower())
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Design.title.ilike(like),
                models.Design.description.ilike(like),
                models.Tag.name.ilike(like),
            )
        )
    if needs_tag_join:
        query = query.distinct()

    total = query.count()
    designs = (
        query.order_by(models.Design.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return schemas.DesignListOut(
        items=[serialize_design(d, db, current_user) for d in designs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=schemas.DesignOut, status_code=201)
def create_design(
    payload: schemas.DesignCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    design = models.Design(
        user_id=current_user.id,
        title=payload.title,
        slug=unique_slug(db, payload.title),
        description=payload.description,
        live_url=payload.live_url,
        category=payload.category,
        status=models.DesignStatus.pending,
        ai_summary=payload.ai_summary,
        colors=payload.colors,
        moderation_flag=payload.moderation_flag,
        moderation_reason=payload.moderation_reason,
    )
    design.tags = get_or_create_tags(db, payload.tags)
    db.add(design)
    db.flush()

    for img in payload.images:
        db.add(models.DesignImage(
            design_id=design.id,
            type=img.type,
            original_url=img.url,
            thumbnail_url=img.thumbnail_url,
        ))

    db.commit()
    db.refresh(design)
    return serialize_design(design, db, current_user)


@router.get("/{slug}", response_model=schemas.DesignOut)
def get_design(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    design = db.query(models.Design).filter(models.Design.slug == slug).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return serialize_design(design, db, current_user)


@router.post("/{design_id}/view", status_code=204)
def track_view(design_id: str, db: Session = Depends(get_db)):
    """Deliberately separate from GET /{slug}: that endpoint is called by
    generateMetadata AND the page component AND any SEO crawler fetching
    the page, none of which represent an actual visitor looking at the
    design. The frontend fires this once, client-side, after the page has
    actually rendered in a browser — a much more honest signal for the
    trending algorithm. No auth required so anonymous visitors count too;
    failures here are non-critical so the frontend fires-and-forgets it."""
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    design.view_count = (design.view_count or 0) + 1
    db.commit()


@router.get("/{slug}/similar", response_model=list[schemas.DesignOut])
def get_similar_designs(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    limit: int = Query(6, ge=1, le=20),
):
    """'You might also like' — scored by shared tags (2 points each) plus
    same category (1 point), falling back to recent designs if there isn't
    enough overlap to fill the list. This is a heuristic, not embeddings —
    good enough signal for an MVP without standing up a vector store."""
    target = db.query(models.Design).filter(models.Design.slug == slug).first()
    if not target:
        raise HTTPException(status_code=404, detail="Design not found")

    target_tag_ids = _tag_ids(target)
    candidates = (
        db.query(models.Design)
        .filter(models.Design.status == models.DesignStatus.approved, models.Design.id != target.id)
        .all()
    )

    scored = []
    for c in candidates:
        overlap = len(target_tag_ids & _tag_ids(c))
        same_category = 1 if target.category and c.category == target.category else 0
        score = overlap * 2 + same_category
        if score > 0:
            scored.append((score, c))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = [c for _, c in scored[:limit]]

    if len(top) < limit:
        exclude_ids = {c.id for c in top} | {target.id}
        filler = (
            db.query(models.Design)
            .filter(models.Design.status == models.DesignStatus.approved)
            .filter(~models.Design.id.in_(exclude_ids))
            .order_by(models.Design.created_at.desc())
            .limit(limit - len(top))
            .all()
        )
        top += filler

    return [serialize_design(d, db, current_user) for d in top]


@router.put("/{design_id}", response_model=schemas.DesignOut)
def update_design(
    design_id: str,
    payload: schemas.DesignUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your design")

    data = payload.model_dump(exclude_unset=True)
    tags = data.pop("tags", None)
    was_approved = design.status == models.DesignStatus.approved

    for field, value in data.items():
        setattr(design, field, value)

    if tags is not None:
        design.tags = get_or_create_tags(db, tags)

    if not was_approved and design.status == models.DesignStatus.approved and not design.published_at:
        design.published_at = datetime.utcnow()

    db.commit()
    db.refresh(design)
    return serialize_design(design, db, current_user)


@router.delete("/{design_id}", status_code=204)
def delete_design(
    design_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if design.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your design")
    db.delete(design)
    db.commit()


@router.post("/{design_id}/like", response_model=schemas.DesignOut)
def toggle_like(
    design_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    existing = db.query(models.Like).filter(
        models.Like.design_id == design_id, models.Like.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
    else:
        db.add(models.Like(design_id=design_id, user_id=current_user.id))

    db.commit()
    return serialize_design(design, db, current_user)


@router.post("/{design_id}/save", response_model=schemas.DesignOut)
def toggle_save(
    design_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    existing = db.query(models.Save).filter(
        models.Save.design_id == design_id, models.Save.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
    else:
        db.add(models.Save(design_id=design_id, user_id=current_user.id))

    db.commit()
    return serialize_design(design, db, current_user)
