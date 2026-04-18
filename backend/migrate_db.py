from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

def migrate():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("Starting migration...")
        
        # 1. Add 'name' column if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE patients_meta ADD COLUMN name VARCHAR NOT NULL DEFAULT 'Unknown'"))
            conn.commit()
            print("Added 'name' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'name' column already exists.")
            else:
                print(f"Error adding 'name' column: {e}")

        # 2. Remove UNIQUE constraint on user_id
        # In Postgres, we need to find the constraint name first or usually it's patients_meta_user_id_key
        try:
            # Drop the constraint if it exists. We'll try common names or catch errors.
            conn.execute(text("ALTER TABLE patients_meta DROP CONSTRAINT IF EXISTS patients_meta_user_id_key"))
            conn.commit()
            print("Dropped unique constraint on user_id.")
        except Exception as e:
            print(f"Error dropping unique constraint: {e}")

        print("Migration complete.")

if __name__ == "__main__":
    migrate()
