from backend.db import get_db_collection
import time

col = get_db_collection('users')
cursor = col.find().sort('created_at', -1).limit(5)
print("Latest User Statuses:")
for u in cursor:
    mobile = u.get("mobile")
    status = u.get("status")
    error = u.get("error", "No error")
    created = u.get("created_at", 0)
    print(f"{mobile}: {status} (Created: {time.ctime(created)})")
    if error != "No error":
        print(f"  Error: {error}")
