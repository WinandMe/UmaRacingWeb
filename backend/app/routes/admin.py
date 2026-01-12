"""Admin endpoints for overrides and moderation"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, Trainee, TraineeStats, AdminAuditLog
from app.models.user import UserRole, TokenData
from app.services.stat_validator import StatsInput, stat_validator
from pydantic import BaseModel
from app.services.auth_service import decode_token
import json

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminStatOverrideRequest(BaseModel):
    trainee_id: int
    stats: StatsInput
    bypass_validation: bool = False
    reason: Optional[str] = None

class AuditLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_username: str
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    reason: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True

class UserBanRequest(BaseModel):
    user_id: int
    banned_until: Optional[datetime] = None
    reason: str

def verify_admin(authorization: Optional[str] = None, db: Session = Depends(get_db)) -> TokenData:
    """Verify user is admin"""
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
    
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return token_data

def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    reason: Optional[str] = None
):
    """Log an admin action"""
    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        old_value=old_value,
        new_value=new_value,
        reason=reason,
        timestamp=datetime.utcnow()
    )
    db.add(audit_log)
    db.commit()

@router.post("/stats/override")
async def override_stats(
    request: AdminStatOverrideRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint: Override trainee stats with optional validation bypass"""
    
    token_data = verify_admin(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Get trainee
    trainee = db.query(Trainee).filter(Trainee.id == request.trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    # Get current stats for audit log
    current_stats = db.query(TraineeStats)\
        .filter(TraineeStats.trainee_id == request.trainee_id)\
        .order_by(TraineeStats.timestamp.desc())\
        .first()
    
    old_value = None
    if current_stats:
        old_value = {
            "speed": current_stats.speed,
            "stamina": current_stats.stamina,
            "power": current_stats.power,
            "guts": current_stats.guts,
            "wit": current_stats.wit
        }
    
    # Validate stats (unless bypass is set)
    stats_dict = request.stats.dict()
    validation_result = stat_validator.validate_stats(
        stats_dict,
        bypass_validation=request.bypass_validation
    )
    
    if not validation_result.is_valid and not request.bypass_validation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stat validation failed: {'; '.join(validation_result.errors)}"
        )
    
    # Create new stat entry with admin override
    new_stats = TraineeStats(
        trainee_id=request.trainee_id,
        speed=request.stats.Speed,
        stamina=request.stats.Stamina,
        power=request.stats.Power,
        guts=request.stats.Guts,
        wit=request.stats.Wit,
        submitted_by=admin.id,
        submitted_role="admin",
        bypass_validation=request.bypass_validation,
        notes=f"Admin override: {request.reason}" if request.reason else "Admin override",
        timestamp=datetime.utcnow()
    )
    
    db.add(new_stats)
    db.commit()
    db.refresh(new_stats)
    
    new_value = {
        "speed": new_stats.speed,
        "stamina": new_stats.stamina,
        "power": new_stats.power,
        "guts": new_stats.guts,
        "wit": new_stats.wit,
        "bypass_validation": request.bypass_validation
    }
    
    # Log action
    log_admin_action(
        db,
        admin_id=admin.id,
        action="STATS_OVERRIDE",
        target_type="trainee",
        target_id=request.trainee_id,
        old_value=old_value,
        new_value=new_value,
        reason=request.reason
    )
    
    return {
        "status": "success",
        "message": f"Stats overridden for trainee {request.trainee_id}",
        "new_stats": new_stats,
        "bypass_validation": request.bypass_validation
    }

@router.post("/users/ban")
async def ban_user(
    request: UserBanRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint: Ban a user"""
    
    token_data = verify_admin(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user
    old_value = {
        "is_banned": user.is_banned,
        "banned_until": user.banned_until.isoformat() if user.banned_until else None,
        "banned_reason": user.banned_reason
    }
    
    user.is_banned = True
    user.banned_until = request.banned_until
    user.banned_reason = request.reason
    db.commit()
    
    new_value = {
        "is_banned": user.is_banned,
        "banned_until": request.banned_until.isoformat() if request.banned_until else None,
        "banned_reason": request.reason
    }
    
    # Log action
    log_admin_action(
        db,
        admin_id=admin.id,
        action="USER_BAN",
        target_type="user",
        target_id=request.user_id,
        old_value=old_value,
        new_value=new_value,
        reason=request.reason
    )
    
    return {
        "status": "success",
        "message": f"User {user.username} has been banned"
    }

@router.post("/users/unban")
async def unban_user(
    user_id: int,
    reason: Optional[str] = None,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint: Unban a user"""
    
    token_data = verify_admin(authorization, db)
    admin = db.query(User).filter(User.id == token_data.user_id).first()
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_value = {
        "is_banned": user.is_banned,
        "banned_until": user.banned_until.isoformat() if user.banned_until else None,
        "banned_reason": user.banned_reason
    }
    
    user.is_banned = False
    user.banned_until = None
    user.banned_reason = None
    db.commit()
    
    new_value = {
        "is_banned": False,
        "banned_until": None,
        "banned_reason": None
    }
    
    # Log action
    log_admin_action(
        db,
        admin_id=admin.id,
        action="USER_UNBAN",
        target_type="user",
        target_id=user_id,
        old_value=old_value,
        new_value=new_value,
        reason=reason
    )
    
    return {
        "status": "success",
        "message": f"User {user.username} has been unbanned"
    }

@router.get("/audit-log", response_model=List[AuditLogResponse])
async def get_audit_log(
    limit: int = 100,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint: View audit log"""
    
    verify_admin(authorization, db)
    
    logs = db.query(AdminAuditLog)\
        .order_by(AdminAuditLog.timestamp.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        result.append(AuditLogResponse(
            id=log.id,
            admin_id=log.admin_id,
            admin_username=admin_user.username if admin_user else "Unknown",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            reason=log.reason,
            timestamp=log.timestamp
        ))
    
    return result

@router.get("/audit-log/user/{target_id}", response_model=List[AuditLogResponse])
async def get_user_audit_log(
    target_id: int,
    limit: int = 50,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Admin endpoint: View audit log for a specific target"""
    
    verify_admin(authorization, db)
    
    logs = db.query(AdminAuditLog)\
        .filter(AdminAuditLog.target_id == target_id)\
        .order_by(AdminAuditLog.timestamp.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        result.append(AuditLogResponse(
            id=log.id,
            admin_id=log.admin_id,
            admin_username=admin_user.username if admin_user else "Unknown",
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            reason=log.reason,
            timestamp=log.timestamp
        ))
    
    return result
