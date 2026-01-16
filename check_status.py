from backend.db import get_db_collection
import sys

mobile = sys.argv[1] if len(sys.argv) > 1 else "9497676236"
users_col = get_db_collection("users")
user = users_col.find_one({"mobile": mobile})
if user:
    print(f"Status for {mobile}: {user.get('status')}")
    print(f"Error: {user.get('error')}")
else:
    print(f"User {mobile} not found")
