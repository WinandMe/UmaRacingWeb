"""UmaLinkedIn posts routes - LinkedIn-style social network"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User
from app.models.social import UmaLinkedInPost, UmaLinkedInLike, UmaLinkedInComment, UmaLinkedInRepost
from app.models.user import TokenData
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/umalinkedin", tags=["umalinkedin-posts"])

def get_current_user(authorization: Optional[str] = None, db: Session = Depends(get_db)) -> TokenData:
    """Extract and validate current user from Authorization header"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    token_data = decode_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return token_data

class PostCreateRequest(BaseModel):
    content: str

class CommentCreateRequest(BaseModel):
    text: str

class PostResponse(BaseModel):
    id: int
    author: str
    author_id: int
    avatar: str
    title: str
    content: str
    time: str
    likes: int
    comments: int
    reposts: int
    liked: bool
    reposted: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CommentResponse(BaseModel):
    id: int
    author: str
    avatar: str
    text: str
    time: str
    likes: int
    
    class Config:
        from_attributes = True

@router.post("/posts", response_model=PostResponse)
async def create_post(
    request: PostCreateRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new post"""
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    new_post = UmaLinkedInPost(
        user_id=user.id,
        content=request.content,
        created_at=datetime.utcnow()
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return PostResponse(
        id=new_post.id,
        author=user.username,
        author_id=user.id,
        avatar="🏇",
        title=f"{'Admin' if user.role == 'admin' else 'Trainer' if user.role == 'trainer' else 'Trainee'}",
        content=new_post.content,
        time="Just now",
        likes=0,
        comments=0,
        reposts=0,
        liked=False,
        reposted=False,
        created_at=new_post.created_at
    )

@router.get("/posts", response_model=List[PostResponse])
async def list_posts(
    limit: int = 50,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all posts"""
    token_data = get_current_user(authorization, db)
    current_user_id = token_data.user_id
    
    posts = db.query(UmaLinkedInPost)\
        .filter(UmaLinkedInPost.is_deleted == False)\
        .order_by(desc(UmaLinkedInPost.created_at))\
        .limit(limit)\
        .all()
    
    result = []
    for post in posts:
        user = db.query(User).filter(User.id == post.user_id).first()
        likes_count = db.query(UmaLinkedInLike).filter(UmaLinkedInLike.post_id == post.id).count()
        comments_count = db.query(UmaLinkedInComment).filter(
            UmaLinkedInComment.post_id == post.id,
            UmaLinkedInComment.is_deleted == False
        ).count()
        reposts_count = db.query(UmaLinkedInRepost).filter(UmaLinkedInRepost.post_id == post.id).count()
        
        liked = db.query(UmaLinkedInLike).filter(
            UmaLinkedInLike.post_id == post.id,
            UmaLinkedInLike.user_id == current_user_id
        ).first() is not None
        
        reposted = db.query(UmaLinkedInRepost).filter(
            UmaLinkedInRepost.post_id == post.id,
            UmaLinkedInRepost.user_id == current_user_id
        ).first() is not None
        
        # Calculate time ago
        delta = datetime.utcnow() - post.created_at
        if delta.days > 0:
            time_str = f"{delta.days} day{'s' if delta.days != 1 else ''} ago"
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            time_str = f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif delta.seconds >= 60:
            minutes = delta.seconds // 60
            time_str = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            time_str = "Just now"
        
        result.append(PostResponse(
            id=post.id,
            author=user.username if user else "Unknown",
            author_id=post.user_id,
            avatar="🏇",
            title=f"{'Admin' if user and user.role == 'admin' else 'Trainer' if user and user.role == 'trainer' else 'Trainee'}",
            content=post.content,
            time=time_str,
            likes=likes_count,
            comments=comments_count,
            reposts=reposts_count,
            liked=liked,
            reposted=reposted,
            created_at=post.created_at
        ))
    
    return result

@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Toggle like on a post"""
    token_data = get_current_user(authorization, db)
    user_id = token_data.user_id
    
    post = db.query(UmaLinkedInPost).filter(UmaLinkedInPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = db.query(UmaLinkedInLike).filter(
        UmaLinkedInLike.post_id == post_id,
        UmaLinkedInLike.user_id == user_id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"liked": False, "message": "Like removed"}
    else:
        new_like = UmaLinkedInLike(post_id=post_id, user_id=user_id)
        db.add(new_like)
        db.commit()
        return {"liked": True, "message": "Post liked"}

@router.post("/posts/{post_id}/repost")
async def toggle_repost(
    post_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Toggle repost"""
    token_data = get_current_user(authorization, db)
    user_id = token_data.user_id
    
    post = db.query(UmaLinkedInPost).filter(UmaLinkedInPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_repost = db.query(UmaLinkedInRepost).filter(
        UmaLinkedInRepost.post_id == post_id,
        UmaLinkedInRepost.user_id == user_id
    ).first()
    
    if existing_repost:
        db.delete(existing_repost)
        db.commit()
        return {"reposted": False, "message": "Repost removed"}
    else:
        new_repost = UmaLinkedInRepost(post_id=post_id, user_id=user_id)
        db.add(new_repost)
        db.commit()
        return {"reposted": True, "message": "Post reposted"}

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get comments for a post"""
    token_data = get_current_user(authorization, db)
    
    comments = db.query(UmaLinkedInComment)\
        .filter(
            UmaLinkedInComment.post_id == post_id,
            UmaLinkedInComment.is_deleted == False
        )\
        .order_by(UmaLinkedInComment.created_at)\
        .all()
    
    result = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        
        delta = datetime.utcnow() - comment.created_at
        if delta.days > 0:
            time_str = f"{delta.days} day{'s' if delta.days != 1 else ''} ago"
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            time_str = f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif delta.seconds >= 60:
            minutes = delta.seconds // 60
            time_str = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            time_str = "Just now"
        
        result.append(CommentResponse(
            id=comment.id,
            author=user.username if user else "Unknown",
            avatar="🏇",
            text=comment.text,
            time=time_str,
            likes=0
        ))
    
    return result

@router.post("/posts/{post_id}/comments")
async def add_comment(
    post_id: int,
    request: CommentCreateRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Add a comment to a post"""
    token_data = get_current_user(authorization, db)
    user_id = token_data.user_id
    
    post = db.query(UmaLinkedInPost).filter(UmaLinkedInPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = UmaLinkedInComment(
        post_id=post_id,
        user_id=user_id,
        text=request.text,
        created_at=datetime.utcnow()
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    user = db.query(User).filter(User.id == user_id).first()
    
    return CommentResponse(
        id=new_comment.id,
        author=user.username if user else "Unknown",
        avatar="🏇",
        text=new_comment.text,
        time="Just now",
        likes=0
    )

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete a post (soft delete)"""
    token_data = get_current_user(authorization, db)
    
    post = db.query(UmaLinkedInPost).filter(UmaLinkedInPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Only owner or admin can delete
    if post.user_id != token_data.user_id and token_data.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    post.is_deleted = True
    db.commit()
    
    return {"message": "Post deleted"}
