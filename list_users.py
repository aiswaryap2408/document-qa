from backend.db import get_db_collection

users_col = get_db_collection("users")
for user in users_col.find():
    print(f"Mobile: {user.get('mobile')}, Status: {user.get('status')}")
