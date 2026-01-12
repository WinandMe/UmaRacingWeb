from pydantic import BaseModel
from typing import Dict, List, Optional

class UmaStats(BaseModel):
    """Uma horse stats"""
    Speed: int
    Stamina: int
    Power: int
    Guts: int
    Wit: int

class UmaDistanceAptitude(BaseModel):
    """Distance aptitude ratings"""
    Sprint: str
    Mile: str
    Medium: str
    Long: str

class UmaSurfaceAptitude(BaseModel):
    """Surface aptitude ratings"""
    Turf: str
    Dirt: str

class UmaData(BaseModel):
    """Individual Uma horse data"""
    name: str
    running_style: str
    gate_number: int
    mood: str
    stats: UmaStats
    distance_aptitude: UmaDistanceAptitude
    surface_aptitude: UmaSurfaceAptitude
    skills: List[str] = []

class RaceInfo(BaseModel):
    """Race information"""
    name: str
    name_jp: str
    distance: int
    type: str  # Sprint, Mile, Medium, Long
    surface: str  # Turf, Dirt
    racecourse: str
    direction: str
    track_condition: str
    stat_threshold: int = 0
    season: str
    month: int

class RaceConfig(BaseModel):
    """Complete race configuration"""
    race: RaceInfo
    umas: List[UmaData]

class RaceFrame(BaseModel):
    """Single frame of race state"""
    sim_time: float
    positions: List[Dict]  # List of {name, distance, position}
    incidents: Dict
    commentary: List[str]
    race_finished: bool

class RaceResult(BaseModel):
    """Final race results"""
    finish_times: Dict[str, float]
    final_positions: List[str]
    uma_of_race: str
    uma_of_race_reason: str
    event_scores: Dict[str, int]
    achievements: Dict[str, str]
    achievement_lines: List[str]  # List of achievement lines for final standings

class ParticipantStats(BaseModel):
    """Participant detailed stats for UI"""
    name: str
    running_style: str
    stats: UmaStats
    distance_aptitude: UmaDistanceAptitude
    surface_aptitude: UmaSurfaceAptitude
    skills: List[str]
    tazuna_advice: str
    gate_number: int

class HonorableMention(BaseModel):
    """Honorable mention for a participant"""
    position: int
    name: str
    achievement: str
