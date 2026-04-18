from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, assessments, patients, reports, analytics
from .config import settings

from .limiter import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# Initialize Database (for scaffold simplicity, we'll create tables on startup)
# In production, use Alembic migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Clinical Decision Support System")

# Register SlowAPI
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
# Explicitly allowing both localhost and 127.0.0.1 on ports 5173/5174 for dev stability
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

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
