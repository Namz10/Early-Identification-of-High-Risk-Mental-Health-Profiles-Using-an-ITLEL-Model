from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Assessment, User, UserRole, PatientMeta
from ..schemas import AssessmentSubmit, AssessmentResponse, AssessmentDetail
from ..deps import get_current_user, require_role
from ..ml.inference import run_inference

router = APIRouter(prefix="/assessments", tags=["assessments"])

@router.post("/submit", response_model=AssessmentResponse)
def submit_assessment(
    assessment_in: AssessmentSubmit, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PATIENT))
):
    # Ensure patient profile exists for this name under the current user
    patient = db.query(PatientMeta).filter(
        PatientMeta.user_id == current_user.id,
        PatientMeta.name == assessment_in.patient_name
    ).first()
    
    if not patient:
        # Create new patient sub-profile if missing
        patient = PatientMeta(
            user_id=current_user.id, 
            name=assessment_in.patient_name,
            # We don't have a strict date format yet, so we store as provided or parse
            date_of_birth=assessment_in.date_of_birth
        )
        db.add(patient)
    else:
        # Update DOB if provided
        if assessment_in.date_of_birth:
            patient.date_of_birth = assessment_in.date_of_birth
    
    db.commit()
    db.refresh(patient)

    # Run LEGIT ML Inference
    results = run_inference(assessment_in.responses)
    
    # Create Assessment record
    assessment = Assessment(
        patient_id=patient.id,
        phq9_responses=assessment_in.responses,
        raw_score=sum(assessment_in.responses),
        risk_level=results["risk_level"],
        confidence_score=results["confidence_score"],
        shap_values=results["shap_values"]
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {
        "assessment_id": assessment.id,
        "risk_level": assessment.risk_level,
        "confidence_score": assessment.confidence_score
    }

@router.get("/{assessment_id}", response_model=AssessmentDetail)
def get_assessment(
    assessment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Access control: clinician or owner
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientMeta).filter(PatientMeta.user_id == current_user.id).first()
        if not patient or assessment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Permission denied")
            
    return assessment
