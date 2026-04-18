from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, JSON, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    CLINICIAN = "clinician"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("PatientMeta", back_populates="user", uselist=False)

class PatientMeta(Base):
    __tablename__ = "patients_meta"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")
    assessments = relationship("Assessment", back_populates="patient")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients_meta.id"))
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    phq9_responses = Column(JSON)
    raw_score = Column(Integer)
    risk_level = Column(String)
    confidence_score = Column(Float)
    shap_values = Column(JSON)

    patient = relationship("PatientMeta", back_populates="assessments")
    report = relationship("Report", back_populates="assessment", uselist=False)

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), unique=True)
    shap_narrative = Column(Text)
    llm_recommendation = Column(Text)
    pdf_path = Column(String)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    assessment = relationship("Assessment", back_populates="report")
