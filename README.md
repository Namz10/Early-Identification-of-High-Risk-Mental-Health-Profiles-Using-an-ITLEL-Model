# MindScreen: Production-Grade Clinical AI Mental Health Platform

MindScreen is a comprehensive clinical decision-support system designed for the early identification of high-risk mental health profiles. It integrates a sophisticated Machine Learning pipeline with a sterile, clinical-grade user interface to assist healthcare providers in risk stratification and diagnostic support.

## 🧠 System Architecture

MindScreen follows a modular, decoupled monorepo architecture:

- **Backend (FastAPI)**: High-performance Python backend managing authentication, session-based assessments, automated SHAP explainability generation, and clinical reporting services.
- **Frontend (React + Vite)**: Clinical-grade dashboard and patient flow built with React, styled with Tailwind CSS, and powered by Recharts for diagnostic visualization.
- **Database (PostgreSQL)**: Relational storage for patient metadata, longitudinal assessment history, and analytical reports.
- **ML Integration**: Direct service-layer integration with the ITLEL (Improved Two-Layer Ensemble Learning) model for risk classification and SHAP (SHapley Additive exPlanations) for local feature diagnostics.

## 🚀 Features Implemented

- **JWT Authentication System**: Secure, role-based access control (Patient vs. Clinician).
- **Clinical Patient Flow**: Step-by-step PHQ-9 interview interface with progression tracking.
- **Clinician Dashboard**: 
    - **Patient Roster**: Searchable, sortable, and filterable data table for population management.
    - **Diagnostic Report View**: Detailed breakdown of patient responses, risk severity scales, and explainability charts.
    - **Population Analytics**: Real-time visualization of risk stratification and demographic trends.
- **Explainability Diagnostics**: Automated SHAP value generation for every assessment, providing clinicians with clear feature-level impact analysis.
- **Clinical Reporting**: One-click PDF report generation containing assessment data, diagnostics, and LLM-powered recommendations.

## 🛠️ Setup Instructions

To run the full MindScreen environment locally, follow these steps:

### 1. Clone & Environment Setup
```powershell
# Clone the repository
git clone <repo_url>
cd <repo_directory>

# Setup backend environment (Python 3.9+)
cd backend
pip install -r requirements.txt
# Ensure your .env is configured with DATABASE_URL
alembic upgrade head
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 2. Frontend Initialization
```powershell
# Open a new terminal in the repository root
cd frontend
npm install
npm run dev
```

The system will be available at:
- **Frontend**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8001/docs`

## 📡 API Overview

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/auth/login` | POST | Authenticates user and returns JWT + Role |
| `/assessments/submit` | POST | Processes PHQ-9 responses and runs ML inference |
| `/patients/` | GET | Retrieves roster of patients and latest risk status |
| `/reports/{id}/pdf` | GET | Streams generated clinical report as PDF |
| `/analytics/population` | GET | Aggregates system-wide mental health metrics |

## 🖥️ Screens Overview

- **Landing**: Entry portal for patients and specialists.
- **Assessment**: Sterile interview environment for PHQ-9 data collection.
- **Dashboard**: High-level patient roster for clinician management.
- **Report**: Deep-dive diagnostic view with SHAP charts and clinical prose.
- **Analytics**: Longitudinal population trends and risk factor distribution.

---

### ⚠️ Clinical Disclaimer
MindScreen is a clinical decision-support tool designed for use by qualified healthcare professionals. It does not constitute a formal diagnosis. All AI-generated recommendations and risk levels must be reviewed and validated by a licensed clinician before diagnostic or treatment decisions are made.
