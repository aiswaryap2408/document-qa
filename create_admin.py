import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to reach backend module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.db import get_db_collection

load_dotenv()

def create_admin_user(username, password):
    admins_col = get_db_collection("admins")
    
    # Check if admin already exists
    existing = admins_col.find_one({"username": username})
    if existing:
        print(f"Admin user '{username}' already exists. Updating password...")
        admins_col.update_one({"username": username}, {"$set": {"password": password}})
        print("Password updated successfully.")
    else:
        admins_col.insert_one({"username": username, "password": password})
        print(f"Admin user '{username}' created successfully.")

if __name__ == "__main__":
    # Credentials from requirement
    create_admin_user("admin", "admin123")
