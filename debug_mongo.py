
from pymongo import MongoClient
import os
import time

def test_mongo_insertion():
    # Matches streamlit_auth.py
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    print(f"Connecting to: {uri}...")
    
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        # Force connection check
        client.admin.command('ping')
        print("SUCCESS: Connected to MongoDB.")
    except Exception as e:
        print(f"FAILURE: Could not connect to MongoDB. Error: {e}")
        return

    db = client["auth_db"]
    users = db["users"]
    
    # Test Data
    test_mobile = "DEBUG_TEST"
    test_doc = {
        "mobile": test_mobile,
        "name": "Debug User",
        "created_at": time.time()
    }
    
    # Cleanup first
    users.delete_one({"mobile": test_mobile})
    
    print("Attempting to insert document...")
    try:
        result = users.insert_one(test_doc)
        print(f"SUCCESS: Inserted document with ID: {result.inserted_id}")
    except Exception as e:
        print(f"FAILURE: Insertion failed. Error: {e}")
        return
        
    print("Verifying insertion...")
    found = users.find_one({"mobile": test_mobile})
    if found:
        print(f"SUCCESS: Document found: {found}")
    else:
        print("FAILURE: Document NOT found after insertion.")

    # Cleanup
    users.delete_one({"mobile": test_mobile})
    print("Cleanup done.")

if __name__ == "__main__":
    test_mongo_insertion()
