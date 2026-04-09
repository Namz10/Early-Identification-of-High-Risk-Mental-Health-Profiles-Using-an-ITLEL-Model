import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.deps import get_password_hash

def seed_db():
    print("Initializing emergency database re-seeding...")
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing test users to ensure new hashes are applied
        print("Clearing existing test accounts...")
        db.query(User).filter(User.email.in_(["patient@mindscreen.com", "clinician@mindscreen.com"])).delete(synchronize_session=False)
        db.commit()

        print("Creating test patient account (PBKDF2)...")
        patient = User(
            email="patient@mindscreen.com",
            hashed_password=get_password_hash("patient123"),
            full_name="Test Patient",
            role=UserRole.PATIENT
        )
        db.add(patient)
    
        print("Creating test clinician account (PBKDF2)...")
        clinician = User(
            email="clinician@mindscreen.com",
            hashed_password=get_password_hash("clinician123"),
            full_name="Dr. Specialist",
            role=UserRole.CLINICIAN
        )
        db.add(clinician)
        
        db.commit()
        print("Seeding completed successfully.")
        print("\nTest Credentials:")
        print("Patient:   patient@mindscreen.com / patient123")
        print("Clinician: clinician@mindscreen.com / clinician123")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
