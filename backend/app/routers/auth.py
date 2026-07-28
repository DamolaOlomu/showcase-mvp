from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user, is_admin_user
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_public(user: models.User) -> schemas.UserPublic:
    out = schemas.UserPublic.model_validate(user)
    out.is_admin = is_admin_user(user)
    return out


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        (models.User.email == payload.email) | (models.User.username == payload.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already taken")

    user = models.User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return schemas.Token(access_token=token, user=_user_public(user))


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="This account has been suspended.")

    token = create_access_token(subject=user.id)
    return schemas.Token(access_token=token, user=_user_public(user))


@router.get("/me", response_model=schemas.UserPublic)
def me(current_user: models.User = Depends(get_current_user)):
    return _user_public(current_user)
