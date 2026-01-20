"""Direct messaging system with admin moderation"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, DirectMessage, AdminAuditLog
from app.models.user import TokenData, UserRole
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/dms", tags=["direct messages"])

class DMResponse(BaseModel):
    id: int
    from_user: str
    to_user: str
    message: str
    sent_at: datetime
    is_deleted: bool
    
    class Config:
        from_attributes = True

class DMRequest(BaseModel):
    to_user_id: int
    message: str
    
    class Config:
        max_length = 5000

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

@router.post("/send")
async def send_dm(
    dm_request: DMRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Send a direct message"""
    
    token_data = get_current_user(authorization, db)
    sender = db.query(User).filter(User.id == token_data.user_id).first()
    
    if sender.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are banned and cannot send messages"
        )
    
    if len(dm_request.message.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    if len(dm_request.message) > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message exceeds 5000 character limit"
        )
    
    recipient = db.query(User).filter(User.id == dm_request.to_user_id).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    if dm_request.to_user_id == sender.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Check if recipient has blocked sender
    blocked = db.query(User).filter(
        User.id == recipient.id,
        User.blocked_users.any(
            (DirectMessage.from_user_id == sender.id)
        )
    ).first()
    
    new_message = DirectMessage(
        from_user_id=sender.id,
        to_user_id=recipient.id,
        message=dm_request.message,
        sent_at=datetime.utcnow(),
        is_deleted=False
    )
    
    db.add(new_message)
    db.commit()
    
    return {
        "status": "success",
        "message_id": new_message.id,
        "sent_at": new_message.sent_at
    }

@router.get("/conversation/{user_id}", response_model=List[DMResponse])
async def get_conversation(
    user_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get conversation with a specific user"""
    
    token_data = get_current_user(authorization, db)
    current_user = db.query(User).filter(User.id == token_data.user_id).first()
    
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all messages between these two users, ordered by time
    messages = db.query(DirectMessage).filter(
        ((DirectMessage.from_user_id == current_user.id) & (DirectMessage.to_user_id == user_id)) |
        ((DirectMessage.from_user_id == user_id) & (DirectMessage.to_user_id == current_user.id))
    ).order_by(DirectMessage.sent_at).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        recipient = db.query(User).filter(User.id == msg.to_user_id).first()
        
        # Don't show deleted messages to non-admin non-participants
        if msg.is_deleted and msg.from_user_id != current_user.id and msg.to_user_id != current_user.id:
            continue
        
        result.append(DMResponse(
            id=msg.id,
            from_user=sender.username,
            to_user=recipient.username,
            message=msg.message if not msg.is_deleted else "[DELETED]",
            sent_at=msg.sent_at,
            is_deleted=msg.is_deleted
        ))
    
    return result

@router.get("/inbox", response_model=List[dict])
async def get_inbox(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all DM conversations (inbox summary)"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Get distinct conversations
    messages = db.query(DirectMessage).filter(
        (DirectMessage.to_user_id == user.id) | (DirectMessage.from_user_id == user.id)
    ).order_by(DirectMessage.sent_at.desc()).all()
    
    conversations = {}
    for msg in messages:
        other_id = msg.from_user_id if msg.to_user_id == user.id else msg.to_user_id
        
        if other_id not in conversations:
            other_user = db.query(User).filter(User.id == other_id).first()
            conversations[other_id] = {
                "user_id": other_id,
                "username": other_user.username,
                "last_message": msg.message if not msg.is_deleted else "[DELETED]",
                "last_message_at": msg.sent_at,
                "unread_count": 0
            }
        
        # Count unread messages for this user
        if msg.to_user_id == user.id and not msg.is_read:
            conversations[other_id]["unread_count"] += 1
    
    return list(conversations.values())

@router.delete("/message/{message_id}")
async def delete_message(
    message_id: int,
    reason: Optional[str] = None,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete a direct message (message can only be deleted by sender or admin)"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    message = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Only sender or admin can delete
    if message.from_user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete this message"
        )
    
    sender = db.query(User).filter(User.id == message.from_user_id).first()
    recipient = db.query(User).filter(User.id == message.to_user_id).first()
    
    message.is_deleted = True
    message.deletion_reason = reason
    message.deleted_by_admin = (user.role == UserRole.ADMIN and user.id != message.from_user_id)
    
    # Audit log if admin deletion
    if user.role == UserRole.ADMIN and user.id != message.from_user_id:
        audit = AdminAuditLog(
            admin_id=user.id,
            action="delete_dm",
            target_type="message",
            target_id=message.id,
            old_value=None,
            new_value={"deleted": True, "reason": reason},
            timestamp=datetime.utcnow()
        )
        db.add(audit)
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Message deleted",
        "deleted_at": datetime.utcnow()
    }

@router.post("/admin/view-dm/{from_user_id}/{to_user_id}")
async def admin_view_dm_conversation(
    from_user_id: int,
    to_user_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint to view any DM conversation"""
    
    token_data = get_current_user(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    if admin.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view DM conversations"
        )
    
    messages = db.query(DirectMessage).filter(
        ((DirectMessage.from_user_id == from_user_id) & (DirectMessage.to_user_id == to_user_id)) |
        ((DirectMessage.from_user_id == to_user_id) & (DirectMessage.to_user_id == from_user_id))
    ).order_by(DirectMessage.sent_at).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        recipient = db.query(User).filter(User.id == msg.to_user_id).first()
        
        result.append({
            "id": msg.id,
            "from_user": sender.username,
            "to_user": recipient.username,
            "message": msg.message if not msg.is_deleted else f"[DELETED: {msg.deletion_reason or 'No reason'}]",
            "sent_at": msg.sent_at,
            "is_deleted": msg.is_deleted,
            "deleted_by_admin": msg.deleted_by_admin,
            "deletion_reason": msg.deletion_reason
        })
    
    # Log admin view
    audit = AdminAuditLog(
        admin_id=admin.id,
        action="view_dm_conversation",
        target_type="conversation",
        target_id=None,
        old_value=None,
        new_value={"from_user_id": from_user_id, "to_user_id": to_user_id},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return result

@router.post("/admin/review")
async def admin_review_user_dms(
    user_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint to review all DMs sent/received by a user"""
    
    token_data = get_current_user(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    if admin.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can review user DMs"
        )
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all messages from/to this user
    messages = db.query(DirectMessage).filter(
        (DirectMessage.from_user_id == user_id) | (DirectMessage.to_user_id == user_id)
    ).order_by(DirectMessage.sent_at.desc()).all()
    
    result = {
        "user": target_user.username,
        "total_messages": len(messages),
        "messages": []
    }
    
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        recipient = db.query(User).filter(User.id == msg.to_user_id).first()
        
        result["messages"].append({
            "id": msg.id,
            "from": sender.username,
            "to": recipient.username,
            "message": msg.message if not msg.is_deleted else f"[DELETED: {msg.deletion_reason}]",
            "sent_at": msg.sent_at,
            "is_deleted": msg.is_deleted,
            "deleted_by_admin": msg.deleted_by_admin
        })
    
    # Log admin review
    audit = AdminAuditLog(
        admin_id=admin.id,
        action="review_user_dms",
        target_type="user",
        target_id=user_id,
        old_value=None,
        new_value={"reviewed": True},
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return result
