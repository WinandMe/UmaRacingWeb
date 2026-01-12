"""Race entry and management endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db import get_db
from app.models.database import User, Trainee, TraineeStats, Race, RaceParticipant
from app.models.user import UserRole, TokenData
from pydantic import BaseModel
from app.services.auth_service import decode_token

router = APIRouter(prefix="/api/races", tags=["races"])

class RaceCreateRequest(BaseModel):
    name: str
    race_category: Optional[str] = None
    racecourse: Optional[str] = None
    distance: int
    surface: Optional[str] = None
    race_type: Optional[str] = None
    track_condition: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    config_json: Optional[dict] = None

class RaceParticipantEntry(BaseModel):
    trainee_id: int
    gate_number: int
    running_style: Optional[str] = None
    mood: Optional[str] = None
    skills: Optional[List[int]] = None
    distance_aptitude: Optional[dict] = None
    surface_aptitude: Optional[dict] = None

class RaceParticipantResponse(BaseModel):
    id: int
    race_id: int
    trainee_id: int
    trainee_name: str
    gate_number: int
    running_style: Optional[str]
    mood: Optional[str]
    stats_snapshot: dict
    final_position: Optional[int]
    finish_time: Optional[float]
    
    class Config:
        from_attributes = True

class RaceResponse(BaseModel):
    id: int
    name: str
    race_category: Optional[str]
    racecourse: Optional[str]
    distance: int
    surface: Optional[str]
    race_type: Optional[str]
    track_condition: Optional[str]
    status: str
    participants_count: int
    scheduled_at: Optional[datetime]
    created_at: datetime
    
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

@router.post("/create", response_model=RaceResponse)
async def create_race(
    request: RaceCreateRequest,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Create a new race"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    new_race = Race(
        name=request.name,
        race_category=request.race_category,
        racecourse=request.racecourse,
        distance=request.distance,
        surface=request.surface,
        race_type=request.race_type,
        track_condition=request.track_condition,
        status="scheduled",
        scheduled_at=request.scheduled_at,
        config_json=request.config_json,
        created_by=user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_race)
    db.commit()
    db.refresh(new_race)
    
    return RaceResponse(
        id=new_race.id,
        name=new_race.name,
        race_category=new_race.race_category,
        racecourse=new_race.racecourse,
        distance=new_race.distance,
        surface=new_race.surface,
        race_type=new_race.race_type,
        track_condition=new_race.track_condition,
        status=new_race.status,
        participants_count=0,
        scheduled_at=new_race.scheduled_at,
        created_at=new_race.created_at
    )

@router.post("/{race_id}/enter")
async def enter_race(
    race_id: int,
    entry: RaceParticipantEntry,
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Enter a trainee into a race with current stats snapshot"""
    
    token_data = get_current_user(authorization, db)
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    # Get race
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Race not found"
        )
    
    if race.status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot enter race in {race.status} status"
        )
    
    # Get trainee
    trainee = db.query(Trainee).filter(Trainee.id == entry.trainee_id).first()
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    # Check permissions: can only enter own trainees or trainees you own
    if user.role == UserRole.TRAINEE.value:
        if trainee.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only enter your own trainee"
            )
    elif user.role == UserRole.TRAINER.value:
        if trainee.trainer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only enter your own trainees"
            )
    # Admin can enter any trainee
    
    # Check if trainee already in race
    existing = db.query(RaceParticipant).filter(
        RaceParticipant.race_id == race_id,
        RaceParticipant.trainee_id == entry.trainee_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainee is already entered in this race"
        )
    
    # Check gate number not taken
    gate_taken = db.query(RaceParticipant).filter(
        RaceParticipant.race_id == race_id,
        RaceParticipant.gate_number == entry.gate_number
    ).first()
    if gate_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gate {entry.gate_number} is already occupied"
        )
    
    # Get latest stats for snapshot
    latest_stats = db.query(TraineeStats)\
        .filter(TraineeStats.trainee_id == entry.trainee_id)\
        .order_by(TraineeStats.timestamp.desc())\
        .first()
    
    if not latest_stats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trainee has no stats submitted"
        )
    
    # Create stats snapshot
    stats_snapshot = {
        "Speed": latest_stats.speed,
        "Stamina": latest_stats.stamina,
        "Power": latest_stats.power,
        "Guts": latest_stats.guts,
        "Wit": latest_stats.wit,
        "Total": latest_stats.speed + latest_stats.stamina + latest_stats.power + latest_stats.guts + latest_stats.wit,
        "Submitted": latest_stats.timestamp.isoformat()
    }
    
    # Create race participant
    participant = RaceParticipant(
        race_id=race_id,
        trainee_id=entry.trainee_id,
        gate_number=entry.gate_number,
        running_style=entry.running_style,
        mood=entry.mood,
        stats_snapshot=stats_snapshot,
        skills=entry.skills,
        distance_aptitude=entry.distance_aptitude,
        surface_aptitude=entry.surface_aptitude,
        created_at=datetime.utcnow()
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    return {
        "status": "success",
        "message": f"Trainee {trainee.name} entered race {race.name}",
        "participant_id": participant.id,
        "stats_snapshot": stats_snapshot
    }

@router.get("/{race_id}", response_model=RaceResponse)
async def get_race(race_id: int, db: Session = Depends(get_db)):
    """Get race details"""
    
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Race not found"
        )
    
    participant_count = db.query(RaceParticipant)\
        .filter(RaceParticipant.race_id == race_id)\
        .count()
    
    return RaceResponse(
        id=race.id,
        name=race.name,
        race_category=race.race_category,
        racecourse=race.racecourse,
        distance=race.distance,
        surface=race.surface,
        race_type=race.race_type,
        track_condition=race.track_condition,
        status=race.status,
        participants_count=participant_count,
        scheduled_at=race.scheduled_at,
        created_at=race.created_at
    )

@router.get("/{race_id}/participants", response_model=List[RaceParticipantResponse])
async def get_race_participants(race_id: int, db: Session = Depends(get_db)):
    """Get participants in a race"""
    
    race = db.query(Race).filter(Race.id == race_id).first()
    if not race:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Race not found"
        )
    
    participants = db.query(RaceParticipant)\
        .filter(RaceParticipant.race_id == race_id)\
        .order_by(RaceParticipant.gate_number)\
        .all()
    
    result = []
    for p in participants:
        trainee = db.query(Trainee).filter(Trainee.id == p.trainee_id).first()
        result.append(RaceParticipantResponse(
            id=p.id,
            race_id=p.race_id,
            trainee_id=p.trainee_id,
            trainee_name=trainee.name if trainee else "Unknown",
            gate_number=p.gate_number,
            running_style=p.running_style,
            mood=p.mood,
            stats_snapshot=p.stats_snapshot,
            final_position=p.final_position,
            finish_time=float(p.finish_time) if p.finish_time else None
        ))
    
    return result

@router.get("/", response_model=List[RaceResponse])
async def list_races(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List races"""
    
    query = db.query(Race)
    
    if status:
        query = query.filter(Race.status == status)
    
    races = query.order_by(Race.created_at.desc()).limit(limit).all()
    
    result = []
    for race in races:
        participant_count = db.query(RaceParticipant)\
            .filter(RaceParticipant.race_id == race.id)\
            .count()
        
        result.append(RaceResponse(
            id=race.id,
            name=race.name,
            race_category=race.race_category,
            racecourse=race.racecourse,
            distance=race.distance,
            surface=race.surface,
            race_type=race.race_type,
            track_condition=race.track_condition,
            status=race.status,
            participants_count=participant_count,
            scheduled_at=race.scheduled_at,
            created_at=race.created_at
        ))
    
    return result
