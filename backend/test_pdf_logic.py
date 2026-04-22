import sys
import os
# Add backend app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

from app.database import SessionLocal
from app.models import Assessment, PatientMeta, User
from app.routers.reports import generate_pdf_report
from fastapi import Request

def test_pdf():
    print("Testing PDF Generation logic...")
    db = SessionLocal()
    try:
        # Get a real assessment from the DB
        assessment = db.query(Assessment).first()
        if not assessment:
            print("No assessments found in DB to test.")
            return
        
        user = db.query(User).filter(User.id == assessment.patient.user_id).first()
        
        # We manually call the PDF generator logic
        # Since it returns a Response object, we just check if it's there
        print(f"Generating PDF for Assessment ID: {assessment.id}")
        response = generate_pdf_report(assessment.id, db, user)
        
        if response.media_type == "application/pdf":
            print("SUCCESS: PDF Response generated with correct media type.")
            print(f"Content length: {len(response.body)} bytes")
        else:
            print(f"FAILED: Wrong media type {response.media_type}")
            
    except Exception as e:
        print(f"PDF test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_pdf()
