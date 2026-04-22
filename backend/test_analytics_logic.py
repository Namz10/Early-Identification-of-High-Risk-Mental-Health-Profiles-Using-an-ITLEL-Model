import sys
import os
# Add backend app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "app")))

from app.database import SessionLocal
from app.models import User, UserRole
from app.routers.analytics import get_population_analytics

def test_analytics():
    print("Testing Analytics logic...")
    db = SessionLocal()
    try:
        # Get a clinician user for the dependency
        clinician = db.query(User).filter(User.role == UserRole.CLINICIAN).first()
        if not clinician:
            print("No clinician user found in DB.")
            return
        
        # Call the analytics function
        print("Fetching population analytics...")
        data = get_population_analytics(db, clinician)
        
        print(f"Risk Distribution: {data['risk_distribution']}")
        print(f"Avg PHQ-9 Score: {data['avg_phq9_score']:.2f}")
        print(f"Trend Data Points: {len(data['trend_over_time'])}")
        print(f"Prevalent Features: {data['most_prevalent_features']}")
        
        if len(data['risk_distribution']) > 0:
            print("SUCCESS: Analytics data is non-empty and legit.")
        else:
            print("WARNING: Analytics data is empty (but query ran).")
            
    except Exception as e:
        print(f"Analytics test failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_analytics()
