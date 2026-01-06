from backend.db import get_db_collection
import time

col = get_db_collection('users')
cursor = col.find().sort('created_at', -1).limit(10)
print("Latest 10 User Statuses:")
for u in cursor:
    mobile = u.get("mobile")
    status = u.get("status")
    error = u.get("error", "No error")
    created = u.get("created_at", 0)
    print(f"Mobile: {mobile}")
    print(f"  Status: {status}")
    print(f"  Error: {error}")
    print(f"  Created: {time.ctime(created) if created else 'N/A'}")
    print("-" * 20)
