"""Social models for UmaLinkedIn posts, likes, comments, reposts"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.database import Base

class UmaLinkedInPost(Base):
    """LinkedIn-style posts"""
    __tablename__ = "umalinkedin_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    user = relationship("User", foreign_keys=[user_id])
    likes = relationship("UmaLinkedInLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("UmaLinkedInComment", back_populates="post", cascade="all, delete-orphan")
    reposts = relationship("UmaLinkedInRepost", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_posts_user_created', 'user_id', 'created_at'),
    )

class UmaLinkedInLike(Base):
    """Post likes"""
    __tablename__ = "umalinkedin_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("umalinkedin_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("UmaLinkedInPost", back_populates="likes")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_like'),
    )

class UmaLinkedInComment(Base):
    """Post comments"""
    __tablename__ = "umalinkedin_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("umalinkedin_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_deleted = Column(Boolean, default=False)

    post = relationship("UmaLinkedInPost", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        Index('idx_comments_post_created', 'post_id', 'created_at'),
    )

class UmaLinkedInRepost(Base):
    """Post reposts"""
    __tablename__ = "umalinkedin_reposts"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("umalinkedin_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("UmaLinkedInPost", back_populates="reposts")
    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_repost'),
    )
