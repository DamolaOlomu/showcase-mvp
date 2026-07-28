from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/designs", response_model=list[schemas.DesignOut])
def list_all_designs(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
    status: Optional[models.DesignStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Unlike the public /api/designs list, this shows every status
    (pending/approved/rejected) so the queue is visible, and defaults to
    newest-first so new submissions surface immediately."""
    from app.routers.designs import serialize_design

    query = db.query(models.Design)
    if status:
        query = query.filter(models.Design.status == status)

    designs = (
        query.order_by(models.Design.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return [serialize_design(d, db, admin) for d in designs]


def _get_design_or_404(db: Session, design_id: str) -> models.Design:
    design = db.query(models.Design).filter(models.Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return design


@router.put("/designs/{design_id}/approve", response_model=schemas.DesignOut)
def approve_design(
    design_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    from app.routers.designs import serialize_design

    design = _get_design_or_404(db, design_id)
    design.status = models.DesignStatus.approved
    if not design.published_at:
        design.published_at = datetime.utcnow()
    db.commit()
    db.refresh(design)
    return serialize_design(design, db, admin)


@router.put("/designs/{design_id}/reject", response_model=schemas.DesignOut)
def reject_design(
    design_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    from app.routers.designs import serialize_design

    design = _get_design_or_404(db, design_id)
    design.status = models.DesignStatus.rejected
    db.commit()
    db.refresh(design)
    return serialize_design(design, db, admin)


@router.put("/designs/{design_id}/feature", response_model=schemas.DesignOut)
def toggle_feature_design(
    design_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    from app.routers.designs import serialize_design

    design = _get_design_or_404(db, design_id)
    design.featured = not design.featured
    db.commit()
    db.refresh(design)
    return serialize_design(design, db, admin)


@router.delete("/designs/{design_id}", status_code=204)
def delete_design(
    design_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    design = _get_design_or_404(db, design_id)
    db.delete(design)
    db.commit()


@router.get("/users", response_model=list[schemas.AdminUserOut])
def list_all_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    from app.routers.users import serialize_user

    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    out = []
    for u in users:
        base = serialize_user(u, db, admin)
        out.append(schemas.AdminUserOut(**base.model_dump(), email=u.email))
    return out


@router.put("/users/{user_id}/suspend", response_model=schemas.AdminUserOut)
def toggle_suspend_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    from app.routers.users import serialize_user

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You can't suspend your own account")

    user.is_suspended = not user.is_suspended
    db.commit()
    db.refresh(user)

    base = serialize_user(user, db, admin)
    return schemas.AdminUserOut(**base.model_dump(), email=user.email)
