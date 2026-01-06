
import os
import time
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

# Load config from .env
load_dotenv()

def check_active_otps():
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    db_name = os.getenv("MONGODB_DB_NAME", "auth_db")
    
    try:
        if "localhost" in uri or "127.0.0.1" in uri:
            client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        else:
            client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        
        db = client[db_name]
        otp_col = db["otps"]
        
        print(f"--- Checking for Active OTPs in Database: {db_name} ---")
        active_otps = list(otp_col.find().sort("created_at", -1))
        
        if not active_otps:
            print("No active OTPs found. (They are deleted automatically after successful verification!)")
        else:
            print(f"Found {len(active_otps)} active OTP(s):")
            for o in active_otps:
                created_dt = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(o.get('created_at')))
                print(f"  > Mobile: {o.get('mobile')}")
                print(f"    OTP: {o.get('otp')}")
                print(f"    Created At: {created_dt}")
                print("-" * 30)
                
    except Exception as e:
        print(f"Error checking database: {e}")

if __name__ == "__main__":
    check_active_otps()
