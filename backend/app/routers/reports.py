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
    
    patient = assessment.patient
    report = db.query(Report).filter(Report.assessment_id == assessment_id).first()
    
    # Ensure report narratives exist
    if not report or not report.shap_narrative or not report.llm_recommendation:
        if not report:
            report = Report(assessment_id=assessment_id)
            db.add(report)
        
        # Sync narratives if missing
        shap_values = assessment.shap_values
        sorted_features = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
        top_3 = sorted_features[:3]
        report.shap_narrative = f"Primary contributors to the {assessment.risk_level.lower()} risk were: " + ", ".join([f"{f.replace('_', ' ')} ({v:+.2f})" for f, v in top_3]) + "."
        
        report.llm_recommendation = (
            f"Note: Potential {assessment.risk_level} depression risk detected (PHQ-9: {assessment.raw_score}). "
            "Suggest immediate clinical follow-up and diagnostic verification."
        )
        db.commit()
        db.refresh(report)

    # PDF Generation Setup
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50
    )
    styles = getSampleStyleSheet()
    
    # Custom styles
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    
    elements = []

    # 1. Header (Banner)
    elements.append(Paragraph("<b>MINDSCREEN</b> | Clinical Assessment Report", styles['Title']))
    elements.append(Paragraph(f"Reference ID: MSC-{assessment_id}-RT", styles['Normal']))
    elements.append(Spacer(1, 20))

    # 2. Patient Bio Section
    elements.append(Paragraph("<b>I. Patient Information</b>", styles['Heading3']))
    bio_data = [
        ["Full Name:", patient.name, "Assessment Date:", assessment.submitted_at.strftime('%Y-%m-%d')],
        ["Date of Birth:", patient.date_of_birth or "Unavailable", "Classification:", assessment.risk_level]
    ]
    bio_table = Table(bio_data, colWidths=[100, 150, 100, 150])
    bio_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (2,0), (2,-1), colors.grey),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LINEBELOW', (0,0), (-1, -1), 0.5, colors.lightgrey),
    ]))
    elements.append(bio_table)
    elements.append(Spacer(1, 20))

    # 3. PHQ-9 Item Record
    elements.append(Paragraph("<b>II. PHQ-9 Itemized Responses</b>", styles['Heading3']))
    
    # Item labels (Simplified from phq9.js)
    questions = [
        "Little interest or pleasure", "Feeling down/depressed", "Sleep issues",
        "Feeling tired/little energy", "Appetite changes", "Feeling bad about self",
        "Trouble concentrating", "Moving/speaking slow/fast", "Thoughts of self-harm"
    ]
    phq_data = [["#", "Clinical Parameter / Response Domain", "Score"]]
    for i, score in enumerate(assessment.phq9_responses):
        phq_data.append([str(i+1), questions[i], str(score)])
    
    phq_data.append(["", "<b>AGGREGATE CLINICAL SCORE</b>", f"<b>{assessment.raw_score} / 27</b>"])
    
    phq_table = Table(phq_data, colWidths=[30, 420, 50])
    phq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('GRID', (0,0), (-1,-2), 0.5, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.lightgrey), # Total row
    ]))
    elements.append(phq_table)
    elements.append(Spacer(1, 20))

    # 4. Diagnostics & Explainability
    elements.append(Paragraph("<b>III. Diagnostics & Explainability (SHAP Value Attribution)</b>", styles['Heading3']))
    elements.append(Paragraph(report.shap_narrative, styles['Normal']))
    elements.append(Spacer(1, 10))
    
    # Confidence Badge
    elements.append(Paragraph(f"<b>Model Confidence:</b> {assessment.confidence_score*100:.1f}%", styles['Normal']))
    elements.append(Spacer(1, 20))

    # 5. Clinical Recommendations
    elements.append(Paragraph("<b>IV. Clinician Recommendations (AI-Assisted)</b>", styles['Heading3']))
    elements.append(Paragraph(report.llm_recommendation, styles['Normal']))
    elements.append(Spacer(1, 30))

    # Disclaimer
    elements.append(Paragraph("<b>Disclaimer:</b> This report is generated by an ITLEL Ensemble ML system. It is intended for use by medical professionals only. All diagnostic conclusions must be verified by a licensed clinician.", styles['Normal']))

    doc.build(elements)
    
    buffer.seek(0)
    response = Response(content=buffer.getvalue(), media_type="application/pdf")
    response.headers["Content-Disposition"] = f"attachment; filename=MindScreen_Report_{assessment_id}.pdf"
    return response
