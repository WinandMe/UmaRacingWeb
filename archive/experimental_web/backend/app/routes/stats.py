"""Stat management endpoints with role-based permissions"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, Trainee, TraineeStats
from app.models.user import UserRole, TokenData
from app.services.stat_validator import StatsInput, stat_validator
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/stats", tags=["stats"])

class StatSubmissionRequest(BaseModel):
    trainee_id: int
    stats: StatsInput
    notes: Optional[str] = None

class StatResponse(BaseModel):
    id: int
    trainee_id: int
    speed: int
    stamina: int
    power: int
    guts: int
    wit: int
    total: int
    submitted_by: str
    submitted_role: str
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
    
    # Extract token from "Bearer <token>"
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

@router.post("/submit", response_model=StatResponse)
async def submit_stats(
    request: StatSubmissionRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Submit or update stats for a trainee
    
    - Trainee can only submit for themselves
    - Trainer can only submit for their trainees
    - Admin can submit for anyone
    """
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Validate trainee exists
    trainee = db.query(Trainee).filter(Trainee.id == request.trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    # Check permissions
    if user.role == UserRole.TRAINEE.value:
        # Trainee can only submit for themselves
        if trainee.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only submit stats for yourself"
            )
    elif user.role == UserRole.TRAINER.value:
        # Trainer can only submit for their trainees
        if trainee.trainer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only submit stats for your trainees"
            )
    # Admin can do anything (no additional check needed)
    
    # Validate stats
    stats_dict = request.stats.dict()
    validation_result = stat_validator.validate_stats(stats_dict)
    
    if not validation_result.is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stat validation failed: {'; '.join(validation_result.errors)}"
        )
    
    # Create new stat entry
    new_stats = TraineeStats(
        trainee_id=request.trainee_id,
        speed=request.stats.Speed,
        stamina=request.stats.Stamina,
        power=request.stats.Power,
        guts=request.stats.Guts,
        wit=request.stats.Wit,
        submitted_by=user.id,
        submitted_role=user.role,
        bypass_validation=False,
        notes=request.notes,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_stats)
    db.commit()
    db.refresh(new_stats)
    
    return StatResponse(
        id=new_stats.id,
        trainee_id=new_stats.trainee_id,
        speed=new_stats.speed,
        stamina=new_stats.stamina,
        power=new_stats.power,
        guts=new_stats.guts,
        wit=new_stats.wit,
        total=new_stats.speed + new_stats.stamina + new_stats.power + new_stats.guts + new_stats.wit,
        submitted_by=user.username,
        submitted_role=user.role,
        timestamp=new_stats.timestamp
    )

@router.get("/{trainee_id}", response_model=Optional[StatResponse])
async def get_latest_stats(
    trainee_id: int,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get the latest stats for a trainee"""
    
    # Optional authentication (anyone can view, but permissions may be checked later)
    token_data = None
    if authorization:
        token_data = get_current_user(authorization, db)
    
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    # Get latest stats
    latest_stats = db.query(TraineeStats)\
        .filter(TraineeStats.trainee_id == trainee_id)\
        .order_by(TraineeStats.timestamp.desc())\
        .first()
    
    if not latest_stats:
        return None
    
    submitted_user = db.query(User).filter(User.id == latest_stats.submitted_by).first()
    
    return StatResponse(
        id=latest_stats.id,
        trainee_id=latest_stats.trainee_id,
        speed=latest_stats.speed,
        stamina=latest_stats.stamina,
        power=latest_stats.power,
        guts=latest_stats.guts,
        wit=latest_stats.wit,
        total=latest_stats.speed + latest_stats.stamina + latest_stats.power + latest_stats.guts + latest_stats.wit,
        submitted_by=submitted_user.username if submitted_user else "Unknown",
        submitted_role=latest_stats.submitted_role,
        timestamp=latest_stats.timestamp
    )

@router.get("/{trainee_id}/history", response_model=List[StatResponse])
async def get_stats_history(
    trainee_id: int,
    limit: int = 10,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get stat submission history for a trainee"""
    
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    stats_history = db.query(TraineeStats)\
        .filter(TraineeStats.trainee_id == trainee_id)\
        .order_by(TraineeStats.timestamp.desc())\
        .limit(limit)\
        .all()
    
    result = []
    for stat_entry in stats_history:
        submitted_user = db.query(User).filter(User.id == stat_entry.submitted_by).first()
        result.append(StatResponse(
            id=stat_entry.id,
            trainee_id=stat_entry.trainee_id,
            speed=stat_entry.speed,
            stamina=stat_entry.stamina,
            power=stat_entry.power,
            guts=stat_entry.guts,
            wit=stat_entry.wit,
            total=stat_entry.speed + stat_entry.stamina + stat_entry.power + stat_entry.guts + stat_entry.wit,
            submitted_by=submitted_user.username if submitted_user else "Unknown",
            submitted_role=stat_entry.submitted_role,
            timestamp=stat_entry.timestamp
        ))
    
    return result
