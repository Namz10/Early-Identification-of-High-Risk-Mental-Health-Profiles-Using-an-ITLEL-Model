from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from datetime import datetime
import json

from ..database import get_db
from ..models import Assessment, Report, User, UserRole, PatientMeta
from ..schemas import ReportResponse, ShapNarrativeRequest, LLMRecommendationRequest
from ..deps import get_current_user, require_role

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/shap-narrative", response_model=ReportResponse)
def generate_shap_narrative(
    req: ShapNarrativeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Logic: Extract shap_values, sort by absolute impact, Convert to prose
    shap_values = assessment.shap_values
    sorted_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
    top_3 = sorted_features[:3]
    
    narrative_points = []
    for feature, val in top_3:
        impact = "elevated" if val > 0 else "reduced"
        narrative_points.append(f"{feature.replace('_', ' ')} (SHAP: {val:+.2f})")
    
    narrative = f"The primary contributors to the {assessment.risk_level.lower()} risk classification were: " + ", ".join(narrative_points) + "."
    
    report = db.query(Report).filter(Report.assessment_id == req.assessment_id).first()
    if not report:
        report = Report(assessment_id=req.assessment_id, shap_narrative=narrative)
        db.add(report)
    else:
        report.shap_narrative = narrative
        
    db.commit()
    db.refresh(report)
    return report

@router.post("/llm-recommendation", response_model=ReportResponse)
def generate_llm_recommendation(
    req: LLMRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    assessment = db.query(Assessment).filter(Assessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    patient = assessment.patient
    # Construct structured prompt (Mocking the LLM response as requested)
    # prompt = f"""
    # System: You are a clinical decision-support assistant. Respond ONLY in formal clinical language.
    # Patient Data: Age: Unknown, Gender: {patient.gender or 'Unknown'}, PHQ-9 Score: {assessment.raw_score}, Risk: {assessment.risk_level}
    # SHAP Contributors: {json.dumps(assessment.shap_values)}
    # Output: Clinical interpretation, Immediate interventions, Follow-up interval, Referral suggestions
    # """
    
    recommendation = (
        "Clinical Interpretation: The patient shows clinical markers consistent with "
        f"{assessment.risk_level.lower()} depression risk based on a PHQ-9 score of {assessment.raw_score}. "
        "Immediate Interventions: Establish a regular monitoring protocol. "
        "Follow-up Interval: 2 weeks. "
        "Referral Suggestions: Cognitive Behavioral Therapy (CBT) and psychiatric evaluation if symptoms persist."
    )
    
    report = db.query(Report).filter(Report.assessment_id == req.assessment_id).first()
    if not report:
        report = Report(assessment_id=req.assessment_id, llm_recommendation=recommendation)
        db.add(report)
    else:
        report.llm_recommendation = recommendation
        
    db.commit()
    db.refresh(report)
    return report

@router.get("/{assessment_id}/pdf")
def generate_pdf_report(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    report = db.query(Report).filter(Report.assessment_id == assessment_id).first()
    if not report or not report.shap_narrative or not report.llm_recommendation:
        # Trigger generation if missing (internal calls)
        # Note: In a real app we'd use service functions, here we just replicate or call the logic
        if not report:
            report = Report(assessment_id=assessment_id)
            db.add(report)
            db.commit()
            db.refresh(report)
        
        # Trigger Narrative
        shap_values = assessment.shap_values
        sorted_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
        top_3 = sorted_features[:3]
        narrative = f"The primary contributors to the {assessment.risk_level.lower()} risk classification were: " + ", ".join([f"{f.replace('_', ' ')} ({v:+.2f})" for f, v in top_3]) + "."
        report.shap_narrative = narrative
        
        # Trigger LLM
        report.llm_recommendation = (
            f"Clinical Interpretation: {assessment.risk_level} depression risk detected. Score: {assessment.raw_score}. "
            "Follow-up: Immediate clinical review advised."
        )
        db.commit()
        db.refresh(report)

    # PDF Generation
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    elements.append(Paragraph("<b>Clinical Decision Support System - Assessment Report</b>", styles['Title']))
    elements.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Patient/Assessment Metadata
    data = [
        ["Patient ID", f"P-{assessment.patient_id}"],
        ["Assessment Date", assessment.submitted_at.strftime('%Y-%m-%d %H:%M')],
        ["PHQ-9 Raw Score", str(assessment.raw_score)],
        ["Risk Classification", assessment.risk_level],
        ["Confidence Score", f"{assessment.confidence_score:.2f}"]
    ]
    t = Table(data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 6)
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    # SHAP Narrative
    elements.append(Paragraph("<b>Explainability (SHAP Metrics)</b>", styles['Heading2']))
    elements.append(Paragraph(report.shap_narrative, styles['Normal']))
    elements.append(Spacer(1, 12))

    # LLM Recommendations
    elements.append(Paragraph("<b>Clinical Recommendations</b>", styles['Heading2']))
    elements.append(Paragraph(report.llm_recommendation, styles['Normal']))
    elements.append(Spacer(1, 12))

    # Footer
    elements.append(Paragraph("<i>Disclaimer: This report is generated by an AI-assisted decision-support system. It should be reviewed by a qualified clinician before any diagnostic or treatment decisions are made.</i>", styles['Italic']))

    doc.build(elements)
    
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf")
