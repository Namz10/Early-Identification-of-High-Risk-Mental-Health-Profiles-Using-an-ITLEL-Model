from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import Dict, List
from ..database import get_db
from ..models import Assessment, User, UserRole, PatientMeta
from ..schemas import PopulationAnalytics
from ..deps import require_role

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/population", response_model=PopulationAnalytics)
def get_population_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CLINICIAN))
):
    # 1. Risk Distribution
    risk_counts = db.query(
        Assessment.risk_level, 
        func.count(Assessment.id)
    ).group_by(Assessment.risk_level).all()
    risk_dist = {r: count for r, count in risk_counts}

    # 2. Average PHQ-9 Score
    avg_score = db.query(func.avg(Assessment.raw_score)).scalar() or 0.0

    # 3. Trend Over Time (Aggregated by Month)
    # Note: SQLite date formatting vs Postgres might differ, but I'll use a generic approach
    # For a scaffold, I'll just return a simplified query
    trends = db.query(
        func.date(Assessment.submitted_at).label("date"),
        func.avg(Assessment.raw_score).label("avg_score")
    ).group_by(func.date(Assessment.submitted_at)).order_by("date").all()
    trend_over_time = [{"date": str(t.date), "score": float(t.avg_score)} for t in trends]

    # 4. Most Prevalent Features (Avg SHAP for High Risk)
    high_risk_assessments = db.query(Assessment.shap_values).filter(Assessment.risk_level == "High").all()
    feature_impacts = {}
    if high_risk_assessments:
        for (shap,) in high_risk_assessments:
            for feature, val in shap.items():
                feature_impacts[feature] = feature_impacts.get(feature, 0) + val
        
        # Average the impacts
        count = len(high_risk_assessments)
        sorted_features = sorted(
            [{"name": k, "impact": v/count} for k, v in feature_impacts.items()],
            key=lambda x: x["impact"],
            reverse=True
        )
        prevalent_features = [f["name"] for f in sorted_features[:5]]
    else:
        prevalent_features = []

    # 5. Demographic Breakdown
    # Gender distribution
    gender_counts = db.query(
        PatientMeta.gender,
        func.count(PatientMeta.id)
    ).group_by(PatientMeta.gender).all()
    demographics = {
        "gender": {str(g or "Unknown"): count for g, count in gender_counts}
    }

    return {
        "risk_distribution": risk_dist,
        "avg_phq9_score": float(avg_score),
        "trend_over_time": trend_over_time,
        "most_prevalent_features": prevalent_features,
        "demographic_breakdown": demographics
    }
