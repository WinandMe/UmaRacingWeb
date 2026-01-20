"""Pydantic schemas for race API responses and requests"""
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class UmaStats(BaseModel):
    """Uma horse stats"""
    speed: int
    stamina: int
    power: int
    guts: int
    wit: int


class RaceCreate(BaseModel):
    """Create race request"""
    name: str
    description: Optional[str] = None
    distance: int
    surface: str = "Turf"
    max_participants: int = 16
    prize_pool: int
    start_time: datetime


class RaceUpdate(BaseModel):
    """Update race request"""
    name: Optional[str] = None
    description: Optional[str] = None
    distance: Optional[int] = None
    surface: Optional[str] = None
    max_participants: Optional[int] = None
    prize_pool: Optional[int] = None
    start_time: Optional[datetime] = None


class RaceResponse(BaseModel):
    """Race information response"""
    id: int
    name: str
    description: Optional[str] = None
    distance: int
    surface: str
    max_participants: int
    current_participants: int
    prize_pool: int
    status: str  # draft, registration, ready, running, completed
    start_time: datetime
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class RaceListResponse(BaseModel):
    """List of races"""
    races: List[RaceResponse]
    total: int


class RegistrationResponse(BaseModel):
    """Registration information"""
    id: int
    race_id: int
    trainee_id: int
    trainee_name: str
    trainer_id: int
    trainer_username: str
    status: str  # pending, approved, rejected
    registered_at: datetime
    
    class Config:
        from_attributes = True


class RegistrationApprove(BaseModel):
    """Approve/reject registration request"""
    registration_id: int
    action: str  # 'approve' or 'reject'
    reason: Optional[str] = None


class LiveRaceFrame(BaseModel):
    """Single frame of live race data"""
    race_id: int
    sim_time: float
    distance_remaining: int
    runners: List[Dict]  # {position, trainee, trainer, current_speed, elapsed_time}
    commentary: List[Dict]  # {timestamp, text}
    milestone: Optional[str] = None


class RaceResultResponse(BaseModel):
    """Final race results"""
    race_id: int
    final_positions: List[Dict]  # {position, trainee_name, finish_time, prize_won}
    uma_of_race: Optional[str] = None
    created_at: datetime
