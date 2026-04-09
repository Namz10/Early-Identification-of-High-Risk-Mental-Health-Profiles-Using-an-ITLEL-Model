from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, assessments, patients, reports, analytics
from .config import settings

# Initialize Database (for scaffold simplicity, we'll create tables on startup)
# In production, use Alembic migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinical Decision Support System")

# CORS Configuration
origins = ["*"] # Development: Allow all origins to bypass local network/host blockers

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(patients.router)
app.include_router(reports.router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "Clinical Decision Support System Backend API"}
