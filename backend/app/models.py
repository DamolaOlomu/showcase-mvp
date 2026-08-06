import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey, Enum, Table, UniqueConstraint, Boolean, Integer
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class DesignStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class ImageType(str, enum.Enum):
    desktop = "desktop"
    tablet = "tablet"
    mobile = "mobile"


# Association table: designs <-> tags
design_tags = Table(
    "design_tags",
    Base.metadata,
    Column("design_id", String, ForeignKey("designs.id"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    avatar_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    website_url = Column(String, nullable=True)
    twitter_url = Column(String, nullable=True)
    dribbble_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    location = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Batch 5 — moderation. Admin status is config-driven (see
    # app.auth.is_admin_user / ADMIN_USERNAMES), not a DB column, so
    # granting/revoking admin never requires a migration.
    is_suspended = Column(Boolean, default=False, nullable=False)

    designs = relationship("Design", back_populates="designer", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    saves = relationship("Save", back_populates="user", cascade="all, delete-orphan")


class Design(Base):
    __tablename__ = "designs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    live_url = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    status = Column(Enum(DesignStatus), default=DesignStatus.pending, nullable=False)

    # Reserved for Batch 2 (AI analysis output) so the schema doesn't need
    # to change later: dominant colors, AI-written description, etc.
    ai_summary = Column(Text, nullable=True)
    colors = Column(String, nullable=True)  # comma-separated hex codes for MVP

    # Batch 5 — moderation, curation, trending
    moderation_flag = Column(String, nullable=True)  # "safe" | "flagged" | None (not AI-analyzed)
    moderation_reason = Column(Text, nullable=True)
    featured = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

    designer = relationship("User", back_populates="designs")
    images = relationship("DesignImage", back_populates="design", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary=design_tags, back_populates="designs")
    likes = relationship("Like", back_populates="design", cascade="all, delete-orphan")
    saves = relationship("Save", back_populates="design", cascade="all, delete-orphan")


class DesignImage(Base):
    __tablename__ = "design_images"

    id = Column(String, primary_key=True, default=gen_uuid)
    design_id = Column(String, ForeignKey("designs.id"), nullable=False)
    type = Column(Enum(ImageType), nullable=False)

    original_url = Column(String, nullable=False)
    optimized_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)

    design = relationship("Design", back_populates="images")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, index=True, nullable=False)

    designs = relationship("Design", secondary=design_tags, back_populates="tags")


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("user_id", "design_id", name="uq_like_user_design"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    design_id = Column(String, ForeignKey("designs.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="likes")
    design = relationship("Design", back_populates="likes")


class Save(Base):
    __tablename__ = "saves"
    __table_args__ = (UniqueConstraint("user_id", "design_id", name="uq_save_user_design"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    design_id = Column(String, ForeignKey("designs.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saves")
    design = relationship("Design", back_populates="saves")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="uq_follow_pair"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    follower_id = Column(String, ForeignKey("users.id"), nullable=False)
    followed_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
