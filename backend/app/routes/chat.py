"""Public chat and moderation endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, ChatMessage
from app.models.user import UserRole, TokenData
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessageSend(BaseModel):
    message: str
    is_ooc: bool = True

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    username: str
    message: str
    is_ooc: bool
    is_deleted: bool
    timestamp: datetime
    
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
    
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is banned"
        )
    
    return token_data

def verify_admin(authorization: Optional[str] = None, db: Session = Depends(get_db)) -> TokenData:
    """Verify user is admin"""
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return token_data

@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageSend,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Send a public chat message"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Validate message length
    if len(request.message) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message exceeds 500 character limit"
        )
    
    if len(request.message.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    new_message = ChatMessage(
        user_id=user.id,
        message=request.message,
        is_ooc=request.is_ooc,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return ChatMessageResponse(
        id=new_message.id,
        user_id=new_message.user_id,
        username=user.username,
        message=new_message.message,
        is_ooc=new_message.is_ooc,
        is_deleted=new_message.is_deleted,
        timestamp=new_message.timestamp
    )

@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(
    limit: int = 100,
    is_ooc: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get chat history"""
    
    query = db.query(ChatMessage).filter(ChatMessage.is_deleted == False)
    
    if is_ooc is not None:
        query = query.filter(ChatMessage.is_ooc == is_ooc)
    
    messages = query.order_by(ChatMessage.timestamp.desc()).limit(limit).all()
    messages.reverse()  # Return oldest first
    
    result = []
    for msg in messages:
        user = db.query(User).filter(User.id == msg.user_id).first()
        result.append(ChatMessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            username=user.username if user else "Unknown",
            message=msg.message,
            is_ooc=msg.is_ooc,
            is_deleted=msg.is_deleted,
            timestamp=msg.timestamp
        ))
    
    return result

@router.delete("/message/{message_id}")
async def delete_message(
    message_id: int,
    reason: Optional[str] = None,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete a chat message (admin only)"""
    
    token_data = verify_admin(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    message.is_deleted = True
    message.deleted_by = admin.id
    message.deleted_reason = reason
    db.commit()
    
    return {
        "status": "success",
        "message": "Chat message deleted"
    }

@router.post("/mute-user/{user_id}")
async def mute_user(
    user_id: int,
    reason: Optional[str] = None,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mute a user from chat (admin only)"""
    
    token_data = verify_admin(authorization, db)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Mark user as banned (prevents chat)
    user.is_banned = True
    user.banned_reason = f"Muted from chat: {reason}" if reason else "Muted from chat"
    db.commit()
    
    return {
        "status": "success",
        "message": f"User {user.username} has been muted"
    }

@router.get("/user/{user_id}/messages", response_model=List[ChatMessageResponse])
async def get_user_messages(
    user_id: int,
    limit: int = 50,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all chat messages from a specific user (admin only)"""
    
    verify_admin(authorization, db)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    messages = db.query(ChatMessage)\
        .filter(ChatMessage.user_id == user_id)\
        .order_by(ChatMessage.timestamp.desc())\
        .limit(limit)\
        .all()
    
    messages.reverse()  # Return oldest first
    
    result = []
    for msg in messages:
        result.append(ChatMessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            username=user.username,
            message=msg.message,
            is_ooc=msg.is_ooc,
            is_deleted=msg.is_deleted,
            timestamp=msg.timestamp
        ))
    
    return result
