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
    latest_sub = db.query(
        Assessment.patient_id,
        func.max(Assessment.submitted_at).label("latest_date")
    ).group_by(Assessment.patient_id).subquery()

    # Join patients with their latest assessment
    # We now use PatientMeta.name directly and include score/id fields
    patients = db.query(
        PatientMeta.id,
        PatientMeta.name,
        latest_sub.c.latest_date,
        Assessment.raw_score,
        Assessment.risk_level,
        Assessment.confidence_score,
        Assessment.id.label("assessment_id")
    ).outerjoin(latest_sub, PatientMeta.id == latest_sub.c.patient_id)\
     .outerjoin(Assessment, (PatientMeta.id == Assessment.patient_id) & (Assessment.submitted_at == latest_sub.c.latest_date))\
     .all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "last_assessment_date": p.latest_date,
            "phq9_score": p.raw_score,
            "risk_level": p.risk_level or "N/A",
            "confidence_score": p.confidence_score or 0.0,
            "latest_assessment_id": p.assessment_id
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
        "name": patient.name,
        "email": patient.user.email if patient.user else None,
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
