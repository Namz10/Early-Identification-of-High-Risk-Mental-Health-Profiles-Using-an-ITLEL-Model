"""
FastAPI server for Mental Health Assessment — ITLEL Model.
Serves predictions and SHAP/LIME explainability results.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import model_service

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ITLEL Mental Health Assessment API",
    description="PHQ-9 assessment with triple-layer ensemble model and SHAP/LIME explainability",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ───────────────────────────────────────────────────────────────────
class AssessmentRequest(BaseModel):
    answers: list[int] = Field(
        ...,
        min_length=9,
        max_length=9,
        description="9 PHQ-9 answers, each 0-3",
    )


class AssessmentResponse(BaseModel):
    risk_score: float
    risk_category: str
    predicted_severity: str
    probabilities: dict[str, float]
    feature_sentiments: dict[str, float]
    shap_values: dict[str, float] | None
    lime_values: dict[str, float] | None
    model_used: bool


# ── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    model_service.try_load_models()


# ── Routes ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_service.MODEL_LOADED,
    }


@app.post("/api/predict", response_model=AssessmentResponse)
def predict(req: AssessmentRequest):
    # Validate each answer is 0-3
    for i, val in enumerate(req.answers):
        if val < 0 or val > 3:
            raise HTTPException(
                status_code=422,
                detail=f"Answer {i+1} must be between 0 and 3, got {val}",
            )

    result = model_service.predict(req.answers)
    return result
