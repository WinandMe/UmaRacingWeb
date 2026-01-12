"""Database models for Uma Racing Web"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint, Index, Text, JSON, DECIMAL, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True, default="trainee")
    email = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    banned_until = Column(DateTime, nullable=True)
    banned_reason = Column(Text, nullable=True)

    trainees = relationship("Trainee", back_populates="user", foreign_keys="Trainee.user_id")
    owned_trainees = relationship("Trainee", back_populates="trainer", foreign_keys="Trainee.trainer_id")
    stat_submissions = relationship("TraineeStats", back_populates="submitted_by_user")
    admin_actions = relationship("AdminAuditLog", back_populates="admin")
    chat_messages = relationship("ChatMessage", foreign_keys="ChatMessage.user_id", back_populates="user")
    sent_dms = relationship("DirectMessage", foreign_keys="DirectMessage.from_user_id", back_populates="sender")
    received_dms = relationship("DirectMessage", foreign_keys="DirectMessage.to_user_id", back_populates="receiver")
    umalinkedin_profile = relationship("UmaLinkedInProfile", back_populates="user", uselist=False)
    sent_scout_requests = relationship("ScoutRequest", foreign_keys="ScoutRequest.requester_user_id", back_populates="requester_user")
    received_scout_requests = relationship("ScoutRequest", foreign_keys="ScoutRequest.target_user_id", back_populates="target_user")

    __table_args__ = (
        CheckConstraint("role IN ('trainee', 'trainer', 'admin')"),
    )

class Trainee(Base):
    __tablename__ = "trainees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    trainer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="trainees")
    trainer = relationship("User", foreign_keys=[trainer_id], back_populates="owned_trainees")
    stats = relationship("TraineeStats", back_populates="trainee", cascade="all, delete-orphan")
    race_participants = relationship("RaceParticipant", back_populates="trainee")

class TraineeStats(Base):
    __tablename__ = "trainee_stats"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("trainees.id", ondelete="CASCADE"), nullable=False, index=True)
    speed = Column(Integer, nullable=False)
    stamina = Column(Integer, nullable=False)
    power = Column(Integer, nullable=False)
    guts = Column(Integer, nullable=False)
    wit = Column(Integer, nullable=False)
    submitted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_role = Column(String(20), nullable=False)
    bypass_validation = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    trainee = relationship("Trainee", back_populates="stats")
    submitted_by_user = relationship("User", back_populates="stat_submissions")

    __table_args__ = (
        CheckConstraint("speed >= 0 AND speed <= 9999"),
        CheckConstraint("stamina >= 0 AND stamina <= 9999"),
        CheckConstraint("power >= 0 AND power <= 9999"),
        CheckConstraint("guts >= 0 AND guts <= 9999"),
        CheckConstraint("wit >= 0 AND wit <= 9999"),
        CheckConstraint("submitted_role IN ('trainee', 'trainer', 'admin')"),
        Index('idx_trainee_stats_trainee', 'trainee_id'),
        Index('idx_trainee_stats_timestamp', 'trainee_id', 'timestamp'),
    )

class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    race_category = Column(String(50), nullable=True)
    racecourse = Column(String(100), nullable=True)
    distance = Column(Integer, nullable=False)
    surface = Column(String(20), nullable=True)
    race_type = Column(String(50), nullable=True)
    track_condition = Column(String(20), nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="scheduled", index=True)
    config_json = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship("RaceParticipant", back_populates="race", cascade="all, delete-orphan")
    result = relationship("RaceResult", back_populates="race", uselist=False)

    __table_args__ = (
        CheckConstraint("status IN ('scheduled', 'running', 'finished', 'cancelled')"),
        Index('idx_races_status', 'status'),
        Index('idx_races_scheduled', 'scheduled_at'),
    )

class RaceParticipant(Base):
    __tablename__ = "race_participants"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False, index=True)
    trainee_id = Column(Integer, ForeignKey("trainees.id", ondelete="CASCADE"), nullable=False, index=True)
    gate_number = Column(Integer, nullable=False)
    running_style = Column(String(10), nullable=True)
    mood = Column(String(20), nullable=True)
    stats_snapshot = Column(JSON, nullable=False)
    skills = Column(JSON, nullable=True)
    distance_aptitude = Column(JSON, nullable=True)
    surface_aptitude = Column(JSON, nullable=True)
    final_position = Column(Integer, nullable=True)
    finish_time = Column(DECIMAL(10, 3), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    race = relationship("Race", back_populates="participants")
    trainee = relationship("Trainee", back_populates="race_participants")

    __table_args__ = (
        UniqueConstraint('race_id', 'trainee_id', name='uq_race_trainee'),
        UniqueConstraint('race_id', 'gate_number', name='uq_race_gate'),
        Index('idx_race_participants_race', 'race_id'),
        Index('idx_race_participants_trainee', 'trainee_id'),
    )

class RaceResult(Base):
    __tablename__ = "race_results"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    result_data = Column(JSON, nullable=False)
    replay_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    race = relationship("Race", back_populates="result")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_ooc = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    deleted_reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="chat_messages")

    __table_args__ = (
        Index('idx_chat_messages_timestamp', 'timestamp'),
        Index('idx_chat_messages_user', 'user_id'),
    )

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    friend_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending", index=True)
    requested_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('user_id', 'friend_id', name='uq_friendship'),
        CheckConstraint("status IN ('pending', 'accepted', 'blocked')"),
        CheckConstraint("user_id != friend_id"),
        Index('idx_friendships_user', 'user_id'),
        Index('idx_friendships_friend', 'friend_id'),
        Index('idx_friendships_status', 'status'),
    )

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_by_admin = Column(Boolean, default=False)
    deletion_reason = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[from_user_id], back_populates="sent_dms")
    receiver = relationship("User", foreign_keys=[to_user_id], back_populates="received_dms")

    __table_args__ = (
        CheckConstraint("from_user_id != to_user_id"),
        Index('idx_dm_from', 'from_user_id', 'sent_at'),
        Index('idx_dm_to', 'to_user_id', 'sent_at'),
    )

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User", back_populates="admin_actions")

    __table_args__ = (
        Index('idx_admin_audit_admin', 'admin_id'),
        Index('idx_admin_audit_target', 'target_type', 'target_id'),
        Index('idx_admin_audit_timestamp', 'timestamp'),
    )

class UmaLinkedInProfile(Base):
    """UmalinkedIn Profile - showcases trainee/trainer for scouting"""
    __tablename__ = "umalinkedin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    headline = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    looking_for = Column(String(50), nullable=False)  # 'trainer' or 'trainee'
    experience_level = Column(String(50), nullable=True)  # 'beginner', 'intermediate', 'advanced', 'professional'
    achievements = Column(JSON, nullable=True)  # List of race wins, skills, etc
    visibility = Column(String(20), default="public", index=True)  # 'public', 'private', 'friends_only'
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="umalinkedin_profile")

class ScoutRequest(Base):
    """Request to recruit a trainee or find a trainer via UmalinkedIn"""
    __tablename__ = "scout_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    request_type = Column(String(20), nullable=False)  # 'recruit_trainee', 'recruit_trainer'
    message = Column(Text, nullable=True)
    status = Column(String(20), default="pending", index=True)  # 'pending', 'accepted', 'rejected', 'cancelled'
    responded_at = Column(DateTime, nullable=True)
    response_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    requester_user = relationship("User", foreign_keys=[requester_user_id], back_populates="sent_scout_requests")
    target_user = relationship("User", foreign_keys=[target_user_id], back_populates="received_scout_requests")

    __table_args__ = (
        UniqueConstraint('requester_user_id', 'target_user_id', 'request_type', name='uq_scout_request'),
        CheckConstraint("request_type IN ('recruit_trainee', 'recruit_trainer')"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected', 'cancelled')"),
        CheckConstraint("requester_user_id != target_user_id"),
        Index('idx_scout_requests_requester', 'requester_user_id'),
        Index('idx_scout_requests_target', 'target_user_id'),
        Index('idx_scout_requests_status', 'status'),
    )

class SystemConfig(Base):
    __tablename__ = "system_config"

    key = Column(String(100), primary_key=True)
    value = Column(JSON, nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
