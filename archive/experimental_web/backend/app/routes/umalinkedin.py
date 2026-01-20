"""UmalinkedIn - Scouting and recruitment platform"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from datetime import datetime
from app.db import get_db
from app.models.database import User, UmaLinkedInProfile, ScoutRequest, Trainee
from app.services.auth_service import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/umalinkedin", tags=["umalinkedin"])


class ProfileCreate(BaseModel):
    headline: str
    bio: str
    avatar_url: Optional[str] = None
    looking_for: str  # 'trainer' or 'trainee'
    experience_level: Optional[str] = None
    visibility: str = "public"


class ProfileUpdate(BaseModel):
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    experience_level: Optional[str] = None
    visibility: Optional[str] = None


class ScoutRequestCreate(BaseModel):
    target_user_id: int
    request_type: str  # 'recruit_trainee', 'recruit_trainer'
    message: Optional[str] = None


class ScoutRequestResponse(BaseModel):
    status: str  # 'pending', 'accepted', 'rejected'
    response_message: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    username: str
    role: str
    headline: str
    bio: str
    avatar_url: Optional[str]
    looking_for: str
    experience_level: Optional[str]
    visibility: str
    views_count: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/profile", response_model=dict)
def create_profile(
    profile: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update UmalinkedIn profile"""
    existing = db.query(UmaLinkedInProfile).filter(
        UmaLinkedInProfile.user_id == current_user.id
    ).first()

    if existing:
        existing.headline = profile.headline
        existing.bio = profile.bio
        existing.avatar_url = profile.avatar_url or existing.avatar_url
        existing.looking_for = profile.looking_for
        existing.experience_level = profile.experience_level
        existing.visibility = profile.visibility
        existing.updated_at = datetime.utcnow()
    else:
        existing = UmaLinkedInProfile(
            user_id=current_user.id,
            headline=profile.headline,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
            looking_for=profile.looking_for,
            experience_level=profile.experience_level,
            visibility=profile.visibility,
        )
        db.add(existing)

    db.commit()
    return {"message": "Profile created/updated successfully", "profile_id": existing.id}


@router.get("/profile/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a user's UmalinkedIn profile"""
    profile = db.query(UmaLinkedInProfile).filter(
        UmaLinkedInProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Check visibility
    if profile.visibility == "private" and profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This profile is private")

    # Increment view count
    if profile.user_id != current_user.id:
        profile.views_count += 1
        db.commit()

    user = profile.user
    return ProfileResponse(
        id=profile.id,
        user_id=user.id,
        username=user.username,
        role=user.role,
        headline=profile.headline,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        looking_for=profile.looking_for,
        experience_level=profile.experience_level,
        visibility=profile.visibility,
        views_count=profile.views_count,
        created_at=profile.created_at,
    )


@router.get("/browse", response_model=List[ProfileResponse])
def browse_profiles(
    looking_for: Optional[str] = Query(None, description="Filter by 'trainer' or 'trainee'"),
    experience_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Browse available profiles for scouting"""
    query = db.query(UmaLinkedInProfile).filter(
        UmaLinkedInProfile.visibility == "public",
        UmaLinkedInProfile.user_id != current_user.id,  # Exclude self
    )

    if looking_for:
        query = query.filter(UmaLinkedInProfile.looking_for == looking_for)

    if experience_level:
        query = query.filter(UmaLinkedInProfile.experience_level == experience_level)

    profiles = query.limit(50).all()

    result = []
    for profile in profiles:
        user = profile.user
        result.append(
            ProfileResponse(
                id=profile.id,
                user_id=user.id,
                username=user.username,
                role=user.role,
                headline=profile.headline,
                bio=profile.bio,
                avatar_url=profile.avatar_url,
                looking_for=profile.looking_for,
                experience_level=profile.experience_level,
                visibility=profile.visibility,
                views_count=profile.views_count,
                created_at=profile.created_at,
            )
        )

    return result


@router.post("/scout-request", response_model=dict)
def send_scout_request(
    request: ScoutRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a recruitment/scouting request"""
    # Validate target user exists
    target_user = db.query(User).filter(User.id == request.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Check for existing request
    existing = db.query(ScoutRequest).filter(
        ScoutRequest.requester_user_id == current_user.id,
        ScoutRequest.target_user_id == request.target_user_id,
        ScoutRequest.request_type == request.request_type,
        ScoutRequest.status.in_(["pending", "accepted"]),
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Request already exists")

    new_request = ScoutRequest(
        requester_user_id=current_user.id,
        target_user_id=request.target_user_id,
        request_type=request.request_type,
        message=request.message,
    )
    db.add(new_request)
    db.commit()

    return {
        "message": "Scout request sent successfully",
        "request_id": new_request.id,
        "status": "pending",
    }


@router.get("/scout-requests/received", response_model=List[dict])
def get_received_requests(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all scout requests received by current user"""
    query = db.query(ScoutRequest).filter(
        ScoutRequest.target_user_id == current_user.id
    )

    if status:
        query = query.filter(ScoutRequest.status == status)

    requests = query.order_by(ScoutRequest.created_at.desc()).all()

    result = []
    for req in requests:
        requester = req.requester_user
        result.append({
            "id": req.id,
            "requester_id": requester.id,
            "requester_username": requester.username,
            "requester_role": requester.role,
            "request_type": req.request_type,
            "message": req.message,
            "status": req.status,
            "created_at": req.created_at,
            "responded_at": req.responded_at,
        })

    return result


@router.get("/scout-requests/sent", response_model=List[dict])
def get_sent_requests(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all scout requests sent by current user"""
    query = db.query(ScoutRequest).filter(
        ScoutRequest.requester_user_id == current_user.id
    )

    if status:
        query = query.filter(ScoutRequest.status == status)

    requests = query.order_by(ScoutRequest.created_at.desc()).all()

    result = []
    for req in requests:
        target = req.target_user
        result.append({
            "id": req.id,
            "target_id": target.id,
            "target_username": target.username,
            "target_role": target.role,
            "request_type": req.request_type,
            "message": req.message,
            "status": req.status,
            "created_at": req.created_at,
            "responded_at": req.responded_at,
            "response_message": req.response_message,
        })

    return result


@router.post("/scout-requests/{request_id}/accept", response_model=dict)
def accept_scout_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a scout request"""
    scout_req = db.query(ScoutRequest).filter(
        ScoutRequest.id == request_id,
        ScoutRequest.target_user_id == current_user.id,
    ).first()

    if not scout_req:
        raise HTTPException(status_code=404, detail="Scout request not found")

    if scout_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    scout_req.status = "accepted"
    scout_req.responded_at = datetime.utcnow()

    # If recruiting trainee: assign trainer
    if scout_req.request_type == "recruit_trainee":
        # Trainer accepts to become trainee's trainer
        trainees = db.query(Trainee).filter(
            Trainee.user_id == scout_req.requester_user_id,
        ).all()

        for trainee in trainees:
            if trainee.trainer_id is None:
                trainee.trainer_id = current_user.id

    # If recruiting trainer: assign trainer
    elif scout_req.request_type == "recruit_trainer":
        # Trainee accepts trainer
        trainees = db.query(Trainee).filter(
            Trainee.user_id == current_user.id,
        ).all()

        for trainee in trainees:
            if trainee.trainer_id is None:
                trainee.trainer_id = scout_req.requester_user_id

    db.commit()
    return {"message": "Scout request accepted", "status": "accepted"}


@router.post("/scout-requests/{request_id}/reject", response_model=dict)
def reject_scout_request(
    request_id: int,
    response: ScoutRequestResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a scout request"""
    scout_req = db.query(ScoutRequest).filter(
        ScoutRequest.id == request_id,
        ScoutRequest.target_user_id == current_user.id,
    ).first()

    if not scout_req:
        raise HTTPException(status_code=404, detail="Scout request not found")

    if scout_req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")

    scout_req.status = "rejected"
    scout_req.responded_at = datetime.utcnow()
    scout_req.response_message = response.response_message

    db.commit()
    return {"message": "Scout request rejected", "status": "rejected"}


@router.post("/scout-requests/{request_id}/cancel", response_model=dict)
def cancel_scout_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel a scout request sent by current user"""
    scout_req = db.query(ScoutRequest).filter(
        ScoutRequest.id == request_id,
        ScoutRequest.requester_user_id == current_user.id,
        ScoutRequest.status == "pending",
    ).first()

    if not scout_req:
        raise HTTPException(status_code=404, detail="Scout request not found or already responded")

    scout_req.status = "cancelled"
    db.commit()
    return {"message": "Scout request cancelled", "status": "cancelled"}
