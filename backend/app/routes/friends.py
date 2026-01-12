"""Friends system endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, Friendship
from app.models.user import TokenData
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/friends", tags=["friends"])

class FriendResponse(BaseModel):
    id: int
    username: str
    status: str
    requested_at: datetime
    accepted_at: Optional[datetime]
    
    class Config:
        from_attributes = True

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

@router.post("/request/{friend_id}")
async def send_friend_request(
    friend_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Send a friend request"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if friend_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself"
        )
    
    friend = db.query(User).filter(User.id == friend_id).first()
    if not friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if friendship already exists
    existing = db.query(Friendship).filter(
        (Friendship.user_id == user.id) & (Friendship.friend_id == friend_id) |
        (Friendship.user_id == friend_id) & (Friendship.friend_id == user.id)
    ).first()
    
    if existing:
        if existing.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already friends"
            )
        elif existing.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already sent"
            )
    
    # Create friend request
    new_request = Friendship(
        user_id=user.id,
        friend_id=friend_id,
        status="pending",
        requested_at=datetime.utcnow()
    )
    
    db.add(new_request)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Friend request sent to {friend.username}"
    }

@router.post("/accept/{friendship_id}")
async def accept_friend_request(
    friendship_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Accept a friend request"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship request not found"
        )
    
    # User must be the recipient
    if friendship.friend_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot accept this friend request"
        )
    
    if friendship.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Friendship is already {friendship.status}"
        )
    
    friendship.status = "accepted"
    friendship.accepted_at = datetime.utcnow()
    db.commit()
    
    requester = db.query(User).filter(User.id == friendship.user_id).first()
    
    return {
        "status": "success",
        "message": f"You are now friends with {requester.username}"
    }

@router.delete("/remove/{friend_id}")
async def remove_friend(
    friend_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Remove a friend"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    friendship = db.query(Friendship).filter(
        ((Friendship.user_id == user.id) & (Friendship.friend_id == friend_id)) |
        ((Friendship.user_id == friend_id) & (Friendship.friend_id == user.id))
    ).first()
    
    if not friendship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
    
    friend = db.query(User).filter(User.id == friend_id).first()
    
    db.delete(friendship)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Removed {friend.username} from friends"
    }

@router.get("/list", response_model=List[FriendResponse])
async def get_friends(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of accepted friends"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Get friends where this user is user_id
    friendships1 = db.query(Friendship)\
        .filter((Friendship.user_id == user.id) & (Friendship.status == "accepted"))\
        .all()
    
    # Get friends where this user is friend_id
    friendships2 = db.query(Friendship)\
        .filter((Friendship.friend_id == user.id) & (Friendship.status == "accepted"))\
        .all()
    
    result = []
    
    for f in friendships1:
        friend = db.query(User).filter(User.id == f.friend_id).first()
        result.append(FriendResponse(
            id=f.id,
            username=friend.username,
            status=f.status,
            requested_at=f.requested_at,
            accepted_at=f.accepted_at
        ))
    
    for f in friendships2:
        friend = db.query(User).filter(User.id == f.user_id).first()
        result.append(FriendResponse(
            id=f.id,
            username=friend.username,
            status=f.status,
            requested_at=f.requested_at,
            accepted_at=f.accepted_at
        ))
    
    return result

@router.get("/pending", response_model=List[dict])
async def get_pending_requests(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get pending friend requests"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Get requests where this user is the recipient
    pending = db.query(Friendship)\
        .filter((Friendship.friend_id == user.id) & (Friendship.status == "pending"))\
        .all()
    
    result = []
    for p in pending:
        requester = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "friendship_id": p.id,
            "from_user": requester.username,
            "from_user_id": requester.id,
            "requested_at": p.requested_at
        })
    
    return result

@router.get("/blocked", response_model=List[dict])
async def get_blocked_users(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of blocked users"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    blocked = db.query(Friendship)\
        .filter((Friendship.user_id == user.id) & (Friendship.status == "blocked"))\
        .all()
    
    result = []
    for b in blocked:
        blocked_user = db.query(User).filter(User.id == b.friend_id).first()
        result.append({
            "friendship_id": b.id,
            "username": blocked_user.username,
            "user_id": blocked_user.id,
            "blocked_at": b.requested_at
        })
    
    return result

@router.post("/block/{user_id}")
async def block_user(
    user_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Block a user"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already blocked
    existing = db.query(Friendship).filter(
        (Friendship.user_id == user.id) & (Friendship.friend_id == user_id) & (Friendship.status == "blocked")
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already blocked"
        )
    
    # Remove friendship if exists
    db.query(Friendship).filter(
        ((Friendship.user_id == user.id) & (Friendship.friend_id == user_id)) |
        ((Friendship.user_id == user_id) & (Friendship.friend_id == user.id))
    ).delete()
    
    # Create block
    block = Friendship(
        user_id=user.id,
        friend_id=user_id,
        status="blocked",
        requested_at=datetime.utcnow()
    )
    
    db.add(block)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Blocked {target_user.username}"
    }

@router.post("/unblock/{user_id}")
async def unblock_user(
    user_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Unblock a user"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    block = db.query(Friendship).filter(
        (Friendship.user_id == user.id) & (Friendship.friend_id == user_id) & (Friendship.status == "blocked")
    ).first()
    
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not blocked"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    
    db.delete(block)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Unblocked {target_user.username}"
    }
