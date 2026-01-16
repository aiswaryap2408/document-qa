from backend.db import get_db_collection
import sys

mobile = "9497676236"
users_col = get_db_collection("users")
user = users_col.find_one({"mobile": mobile})
if user:
    status = user.get('status')
    print(f"Status: {repr(status)}")
else:
    print("User not found")
