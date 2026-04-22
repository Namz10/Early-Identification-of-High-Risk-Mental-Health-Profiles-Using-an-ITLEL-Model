from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from .models import UserRole

# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.PATIENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    message: str
    role: str
    email: str
    full_name: str

class UserAuthResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# Assessment Schemas
class AssessmentSubmit(BaseModel):
    patient_name: str
    date_of_birth: Optional[str] = None
    responses: List[int] = Field(..., min_items=9, max_items=9)

class AssessmentResponse(BaseModel):
    assessment_id: int
    risk_level: str
    confidence_score: float

class AssessmentDetail(BaseModel):
    id: int
    submitted_at: datetime
    phq9_responses: List[int]
    raw_score: int
    risk_level: str
    confidence_score: float
    shap_values: Dict[str, float]

# Patient Schemas
class PatientProfile(BaseModel):
    id: int
    name: str # CHANGED
    email: Optional[EmailStr] # Changed from required to optional as sub-patients might not have emails
    date_of_birth: Optional[datetime]
    gender: Optional[str]
    contact_number: Optional[str]

class PatientListItem(BaseModel):
    id: int
    name: str
    last_assessment_date: Optional[datetime]
    phq9_score: Optional[int]
    risk_level: Optional[str]
    confidence_score: Optional[float]
    latest_assessment_id: Optional[int]

# Report Schemas
class ShapNarrativeRequest(BaseModel):
    assessment_id: int

class LLMRecommendationRequest(BaseModel):
    assessment_id: int

class ReportResponse(BaseModel):
    id: int
    assessment_id: int
    shap_narrative: str
    llm_recommendation: str
    generated_at: datetime

# Analytics Schemas
class PopulationAnalytics(BaseModel):
    risk_distribution: Dict[str, int]
    avg_phq9_score: float
    trend_over_time: List[Dict[str, Any]]
    most_prevalent_features: List[str]
    demographic_breakdown: Dict[str, Dict[str, int]]
