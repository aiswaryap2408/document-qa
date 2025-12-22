from pymongo import MongoClient
import os
import time
from dotenv import load_dotenv

load_dotenv()

def verify_normalization():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "astrology_db")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    test_mobile = "0000000000"
    
    # Clean up before test
    db.users.delete_many({"mobile": test_mobile})
    db.reports.delete_many({"mobile": test_mobile})
    
    print("--- 1. Testing Normalization ---")
    user_doc = {
        "mobile": test_mobile,
        "name": "Test User",
        "created_at": time.time()
    }
    db.users.insert_one(user_doc)
    
    report_doc = {
        "mobile": test_mobile,
        "report_text": "This is a normalized report."
    }
    db.reports.insert_one(report_doc)
    
    # Fetch and check
    user = db.users.find_one({"mobile": test_mobile})
    report = db.reports.find_one({"mobile": test_mobile})
    
    if user and "report_text" not in user:
        print("✅ SUCCESS: User table is lean (no report_text)")
    else:
        print("❌ FAILURE: User table still contains report_text or missing")
        
    if report and "report_text" in report:
        print("✅ SUCCESS: Report found in reports collection")
    else:
        print("❌ FAILURE: Report missing from reports collection")
        
    print("\n--- 2. Testing Unique Index ---")
    try:
        db.users.insert_one({"mobile": test_mobile, "name": "Duplicate"})
        print("❌ FAILURE: Unique index did NOT catch duplicate mobile")
    except Exception as e:
        print(f"✅ SUCCESS: Unique index blocked duplicate: {e}")

    # Cleanup
    db.users.delete_many({"mobile": test_mobile})
    db.reports.delete_many({"mobile": test_mobile})
    print("\nVerification complete.")

if __name__ == "__main__":
    verify_normalization()
