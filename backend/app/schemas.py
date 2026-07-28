from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models import DesignStatus, ImageType


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    website_url: Optional[str] = None
    twitter_url: Optional[str] = None
    dribbble_url: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    follower_count: int = 0
    following_count: int = 0
    followed_by_me: bool = False
    is_admin: bool = False
    is_suspended: bool = False


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    website_url: Optional[str] = None
    twitter_url: Optional[str] = None
    dribbble_url: Optional[str] = None
    location: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- Tags / Images ----------

class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str


class DesignImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: ImageType
    original_url: str
    optimized_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


# ---------- Designs ----------

class DesignImageIn(BaseModel):
    type: ImageType
    url: str
    thumbnail_url: Optional[str] = None


class DesignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    live_url: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []
    images: list[DesignImageIn] = []
    ai_summary: Optional[str] = None
    colors: Optional[str] = None
    moderation_flag: Optional[str] = None
    moderation_reason: Optional[str] = None


class DesignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    live_url: Optional[str] = None
    category: Optional[str] = None
    status: Optional[DesignStatus] = None
    tags: Optional[list[str]] = None


class DesignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    description: Optional[str] = None
    live_url: Optional[str] = None
    category: Optional[str] = None
    status: DesignStatus
    ai_summary: Optional[str] = None
    colors: Optional[str] = None
    moderation_flag: Optional[str] = None
    moderation_reason: Optional[str] = None
    featured: bool = False
    view_count: int = 0
    created_at: datetime
    published_at: Optional[datetime] = None

    designer: UserPublic
    images: list[DesignImageOut] = []
    tags: list[TagOut] = []
    like_count: int = 0
    save_count: int = 0
    liked_by_me: bool = False
    saved_by_me: bool = False


class DesignListOut(BaseModel):
    items: list[DesignOut]
    total: int
    page: int
    page_size: int


# ---------- Admin ----------

class AdminUserOut(UserPublic):
    email: EmailStr
