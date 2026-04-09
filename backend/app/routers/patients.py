from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
from ..database import get_db
from ..models import User, UserRole, PatientMeta, Assessment
from ..schemas import PatientListItem, PatientProfile, AssessmentDetail
from ..deps import require_role

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("/", response_model=List[PatientListItem])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    # Retrieve patients with their latest assessment data
    # Subquery for latest assessment date per patient
    latest_sub = db.query(
        Assessment.patient_id,
        func.max(Assessment.submitted_at).label("latest_date")
    ).group_by(Assessment.patient_id).subquery()

    # Join patients with users and their latest assessment
    # This is a bit complex for a simple scaffold, so I'll do a join
    patients = db.query(
        PatientMeta.id,
        User.full_name.label("name"),
        latest_sub.c.latest_date,
        Assessment.risk_level,
        Assessment.confidence_score
    ).join(User, PatientMeta.user_id == User.id)\
     .outerjoin(latest_sub, PatientMeta.id == latest_sub.c.patient_id)\
     .outerjoin(Assessment, (PatientMeta.id == Assessment.patient_id) & (Assessment.submitted_at == latest_sub.c.latest_date))\
     .all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "last_assessment_date": p.latest_date,
            "risk_level": p.risk_level,
            "confidence_score": p.confidence_score
        } for p in patients
    ]

@router.get("/{patient_id}", response_model=PatientProfile)
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    patient = db.query(PatientMeta).filter(PatientMeta.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return {
        "id": patient.id,
        "full_name": patient.user.full_name,
        "email": patient.user.email,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "contact_number": patient.contact_number
    }

@router.get("/{patient_id}/assessments", response_model=List[AssessmentDetail])
def get_patient_assessments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    patient = db.query(PatientMeta).filter(PatientMeta.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return patient.assessments
